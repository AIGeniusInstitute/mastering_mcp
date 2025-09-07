# research_server.py
import asyncio
import json
import os
from datetime import datetime
from typing import Optional

import arxiv
import tiktoken
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

from browser_use import Agent
from read_link import read_link
from search_api import search_by_tavily
from translate_api import translate_text

# Initialize MCP server
mcp = FastMCP("Web Browser Provider", port=8000)

# browser_session = BrowserSession()

# Load environment variables
load_dotenv()

# Create a browser agent to perform the search, model should support multi-modal,function call
llm = ChatOpenAI(
    model=os.environ['Doubao_Seed_16'],
    api_key=os.environ['OPENAI_API_KEY'],
    base_url=os.environ['OPENAI_BASE_URL'],
)

current_date = datetime.now().strftime('%Y-%m-%d')


class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    source: str

    def __str__(self):
        return f"Title: {self.title}\nURL: {self.url}\nSource: {self.source}\n\nContent:\n{self.content[:500]}...\n"


@mcp.tool(
    name="web_search",
    description="Search the web for information on a specific topic using browser automation."
)
async def web_search(query: str, num_results: int = 5) -> str:
    """
    Search the web for information on a specific topic.
    
    Args:
        query: The search query
        num_results: Number of results to return (default: 5)
        
    Returns:
        A string containing the search results
    """
    print(f"Using `web_search` tool Searching for '{query}'...")

    agent = Agent(
        task=f"Search for information about '{query}'. Find {num_results} high-quality sources. For each source, extract the title, URL, and relevant content. Return the results as a JSON array with 'title', 'url', 'content', and 'source' fields.",
        llm=llm,
        # browser_session=browser_session,
    )

    print(agent)

    # Run the agent
    result = await agent.run(max_steps=10)

    print(f"Search results for '{query}': \n\n{result}\n\n")

    try:
        # Parse the JSON result
        search_results = []
        parsed_results = json.loads(result) if isinstance(result, str) and result.strip().startswith("[") else []

        for item in parsed_results[:num_results]:
            search_results.append(
                SearchResult(
                    title=item.get("title", "Untitled"),
                    url=item.get("url", ""),
                    content=item.get("content", ""),
                    source=item.get("source", "web search")
                )
            )

        # Format the results as a string
        return "\n\n---\n\n".join(str(result) for result in search_results)
    except Exception as e:
        return f"Error parsing search results: {str(e)}\n\nRaw result: {result}"


@mcp.tool(
    name="browse_url",
    description="Browse a specific URL and extract its content using browser automation."
)
async def browse_url(url: str) -> str:
    """
    Browse a specific URL and extract its content.
    
    Args:
        url: The URL to browse
        
    Returns:
        A string containing the extracted content
    """

    print(f"Using `browse_url` tool Browsing URL: {url}")

    agent = Agent(
        task=f"Visit the URL '{url}'. Extract all relevant content including title, main text, and any important data. Format the content in a readable way.",
        llm=llm,
        # browser_session=browser_session,
    )

    print(agent)

    # Run the agent
    result = await agent.run(max_steps=10)

    print(f"Content extracted from URL '{url}': \n\n{result}\n\n")

    return result


class Article(BaseModel):
    title: str
    summary: str
    published_date: str
    pdf_link: Optional[str]

    @classmethod
    def from_arxiv_result(cls, result: arxiv.Result) -> 'Article':
        pdf_links = [str(i) for i in result.links if '/pdf/' in str(i)]
        if len(pdf_links):
            pdf_link = pdf_links[0]
        else:
            pdf_link = None
        return cls(
            title=result.title,
            summary=result.summary,
            published_date=result.published.strftime('%Y-%m-%d'),
            pdf_link=pdf_link
        )

    def __str__(self):
        return f'Title: {self.title}\nDate: {self.published_date}\nPDF Url: {self.pdf_link}\n\n' + '\n'.join(self.summary.splitlines()[:3]) + '\n[...]'


def get_articles_content(query: str, max_results: int) -> list[Article]:
    client = arxiv.Client()
    search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)
    articles = map(lambda x: Article.from_arxiv_result(x), client.results(search))
    articles_with_link = filter(lambda x: x.pdf_link is not None, articles)
    return list(articles_with_link)


@mcp.tool(
    name="search_arxiv",
    description="Get `max_results` articles for a given search query on Arxiv."
)
async def get_articles(query: str, max_results: int) -> str:
    """Get `max_results` articles for a given search query on Arxiv."""
    print(f"Using `search_arxiv` tool Searching for '{query}'...")
    articles = get_articles_content(query, max_results)
    print(f"Found {len(articles)} articles.")
    return '\n\n-------\n\n'.join(map(str, articles)).strip()


def get_article_content_str(article_url: str):
    converter = DocumentConverter()
    result = converter.convert(article_url)
    research = result.document.export_to_markdown()
    return research


def first_lines(text: str, chunk_size: int = 1000) -> str:
    encoder = tiktoken.encoding_for_model('gpt-4')
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=0,
        length_function=lambda x: len(encoder.encode(x)),
        is_separator_regex=False,
    )
    return text_splitter.split_text(text)[0]


@mcp.tool(
    name="extract_article_content",
    description="Extracts the full text content from a research article PDF using OCR technology based on its pdf link `article_url`"
)
async def get_article_content(article_url: str) -> str:
    """Get article content extracted from OCR given its pdf url link `article_url`."""
    articlecontent = get_article_content_str(article_url)

    print(articlecontent)

    return articlecontent.strip()


@mcp.tool(
    name="get_article_preview",
    description="Retrieves the first portion of a research article based on its pdf link `article_url` with a specified token limit (`chunk_size`), useful for quick previews"
)
async def get_article_first_lines(article_url: str, chunk_size: int = 1000) -> str:
    """Get `chunk_size` tokens for an article based on its pdf url link `article_url`."""
    articlecontent = get_article_content_str(article_url)

    first_lines_content = first_lines(articlecontent.strip(), chunk_size)

    return first_lines_content.strip()


@mcp.tool(
    name="search_by_api",
    description="Search for information on a specific topic using Search API"
)
async def search_by_api_tool(q: str) -> str:
    return search_by_tavily(q)


@mcp.tool(
    name="LinkReader",
    description="Read The URL Link Content, Use to Extract Content From Url Link"
)
async def link_reader(url: str) -> str:
    return read_link(url)


@mcp.tool(
    name="Translator",
    description="Translate the text to target language, {lang} is the target language code (e.g. 'zh' for Chinese)"
)
async def translator(text: str, lang='zh') -> str:
    return translate_text(text, target_language=lang)


if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
