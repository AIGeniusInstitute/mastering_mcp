Okay, I can help you develop this Deep Research Report generation system. Based on your requirements and the provided project structure, here's a plan and the corresponding source code.

**Core Idea:**

We'll extend the existing framework by:

1.  **Adding a Web Search Capability:** We'll create a new MCP server (`web_search_server.py`) that provides tools for general web searching. For practical, runnable code within this environment, this server will use the `googleWebSearch` tool. In a real-world scenario, this could be adapted to integrate with `browser-use` by making HTTP calls to its API.
2.  **Defining a Report-Generating Agent:** We'll create `graph.py` to define the LangGraph agent. This agent will be specifically prompted to understand research queries, use all available tools (ArXiv, document analysis, web search), and synthesize the findings into a structured Markdown report.
3.  **Orchestration:** The `client_server.py` will be updated to use this new agent and incorporate the web search tools. It will also handle multi-turn conversation history correctly.
4.  **User Interface:** The provided `streamlit_app.py` will serve as the front end, allowing users to interact with the research assistant and receive the generated Markdown report.

Here are the complete source code files for the project:

**Project Structure:**

```
.
├── README.md
├── arxiv_server.py
├── docling_server.py
├── web_search_server.py
├── graph.py
├── client_server.py
├── streamlit_app.py
├── requirements.txt
├── langgraph.json
├── assets/ (as provided by user, not regenerated here)
├── docker/ (as provided by user, not regenerated here)
├── docker-compose.yml (as provided by user, not regenerated here)
├── kill_all.sh (as provided by user, not regenerated here)
├── post.md (as provided by user, not regenerated here)
├── run_app.sh (as provided by user, not regenerated here)
├── run_arxiv_server.sh (as provided by user, not regenerated here)
├── run_client.sh (as provided by user, not regenerated here)
├── run_docling_server.sh (as provided by user, not regenerated here)
```

**Source Code Files:**

**1. `README.md`**

```markdown
# Deep Research Report Generation System

This project implements a multi-tool research assistant capable of generating deep research reports in Markdown format. It leverages MCP (Model Context Protocol) for tool integration, LangGraph for agent orchestration, FastAPI for the backend API, and Streamlit for the user interface.

## Features

-   **Multi-Tool Integration:** Utilizes tools for searching ArXiv, analyzing documents (PDF OCR), and performing general web searches.
-   **LangGraph Agent:** Employs a ReAct-based agent configured to understand research tasks, gather information, and synthesize it.
-   **Markdown Report Generation:** The primary output is a structured Markdown report covering introduction, methodology, findings from various sources, synthesis, and conclusion.
-   **Multi-Turn Conversation:** Supports ongoing dialogue to refine research tasks.
-   **Web Interface:** Provides an interactive chat interface using Streamlit.

## Architecture

1.  **MCP Servers:**
    *   `arxiv_server.py`: Searches and retrieves articles from ArXiv.
    *   `docling_server.py`: Extracts content from PDF documents.
    *   `web_search_server.py`: Performs general web searches (using Google Search in this implementation).
2.  **LangGraph Agent (`graph.py`):**
    *   Defines the core research agent, its prompt, and tool access.
3.  **Client Server (`client_server.py`):**
    *   A FastAPI application that hosts the LangGraph agent.
    *   Connects to all MCP servers to provide tools to the agent.
    *   Handles user requests and returns the generated report.
4.  **Streamlit UI (`streamlit_app.py`):**
    *   A web-based chat interface for users to interact with the research assistant.

## Prerequisites

-   Python 3.9+
-   An OpenAI API key and relevant model endpoint information, to be set as environment variables:
    -   `MODEL`: Your OpenAI model name (e.g., `gpt-4-turbo`)
    -   `API_KEY`: Your OpenAI API key.
    -   `BASE_URL`: Your OpenAI API base URL (if using a proxy or Azure).
    Create a `.env` file in the root directory with these variables:
    ```
    MODEL="your_model_name"
    API_KEY="your_api_key"
    BASE_URL="your_base_url_if_needed"
    ```

## Running the System

(Assuming you have all dependencies installed via `pip install -r requirements.txt`)

1.  **Start the MCP Servers:**
    ```bash
    python arxiv_server.py
    python docling_server.py
    python web_search_server.py
    ```
    (Each in a separate terminal)

2.  **Start the Client Server (FastAPI + LangGraph):**
    ```bash
    python client_server.py
    ```
    (In a separate terminal)

3.  **Run the Streamlit UI:**
    ```bash
    streamlit run streamlit_app.py
    ```
    (In a separate terminal)

Access the Streamlit UI in your browser (usually at `http://localhost:8501`).

**Note on Web Search:**
The `web_search_server.py` currently uses an internal Google Search tool. To integrate with a system like `browser-use`, you would:
1.  Ensure the `browser-use` API server is running.
2.  Modify `web_search_server.py` to make HTTP requests (e.g., using the `requests` library) to the `browser-use` API endpoints instead of using the `googleWebSearch` tool. The tool definitions (`@mcp.tool`) would remain similar, but their internal implementation would change.

```

**2. `arxiv_server.py`** (Using the code provided by the user)

```python
import arxiv
from mcp.server.fastmcp import FastMCP
from typing import Optional
from pydantic import BaseModel
import asyncio

# Use environment variable for port if available
mcp = FastMCP(
    "Research Article Provider", port=8000
)

class Article(BaseModel):
    title: str
    summary:str
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
        return f'Title: {self.title}\nDate: {self.published_date}\nPDF Url: {self.pdf_link}\n\n'+'\n'.join(self.summary.splitlines()[:3])+'\n[...]'

def get_articles_content(query: str, max_results: int) -> list[Article]:
    client = arxiv.Client()
    search = arxiv.Search(query=query, max_results=max_results, sort_by = arxiv.SortCriterion.Relevance)
    articles = map(lambda x: Article.from_arxiv_result(x), client.results(search))
    articles_with_link = filter(lambda x: x.pdf_link is not None, articles)
    return list(articles_with_link)

@mcp.tool(
    name="search_arxiv",
    description="Get `max_results` articles for a given search query on Arxiv."
)
async def get_articles(query: str, max_results: int) -> str:
    """Get `max_results` articles for a given search query on Arxiv."""
    print(f"Searching for '{query}'...")
    articles = get_articles_content(query, max_results)
    print(f"Found {len(articles)} articles.")
    return '\n\n-------\n\n'.join(map(str, articles)).strip()

if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
```

**3. `docling_server.py`** (Using the code provided by the user)

```python
from mcp.server.fastmcp import FastMCP
from docling.document_converter import DocumentConverter
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken
import asyncio
# Use environment variable for port if available
mcp = FastMCP(
    "Research Article Extraction Provider", port=8001
)

def get_article_content_str(article_url: str):
    converter = DocumentConverter()
    result = converter.convert(article_url)
    research = result.document.export_to_markdown()
    return research

def first_lines(text: str, chunk_size: int = 1536) -> str:
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

    return articlecontent.strip()

@mcp.tool(
    name="get_article_preview",
    description="Retrieves the first portion of a research article based on its pdf link `article_url` with a specified token limit (`chunk_size`), useful for quick previews"
)
async def get_article_first_lines(article_url: str, chunk_size: int = 1536) -> str:
    """Get `chunk_size` tokens for an article based on its pdf url link `article_url`."""
    articlecontent = get_article_content_str(article_url)
    first_lines_content = first_lines(articlecontent.strip(), chunk_size)

    return first_lines_content.strip()

if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
```

**4. `web_search_server.py`** (New file)

```python
from mcp.server.fastmcp import FastMCP
import asyncio
from typing import Dict, Any
import json # For printing dicts nicely

# This server will use the built-in googleWebSearch tool.
# In a real-world scenario with browser-use, you'd make HTTP requests to its API.

mcp = FastMCP(
    "Web Search Provider", port=8002 # Assign a new port
)

# This is a placeholder for how you might call browser-use.
# For this example, we will directly use the googleWebSearch tool.
#
# async def call_browser_use_api(endpoint: str, payload: Dict) -> Dict:
# import httpx
#     BROWSER_USE_BASE_URL = "http://localhost:3000" # Example URL for browser-use API
#     async with httpx.AsyncClient() as client:
#         try:
#             response = await client.post(f"{BROWSER_USE_BASE_URL}/{endpoint}", json=payload, timeout=120)
#             response.raise_for_status()
# return response.json()
#         except httpx.HTTPStatusError as e:
#             print(f"HTTP error occurred: {e}")
#             return {"error": str(e), "details": e.response.text if e.response else "No response"}
#         except httpx.RequestError as e:
#             print(f"Request error occurred: {e}")
#             return {"error": f"Request failed: {e}"}

@mcp.tool(
    name="perform_web_search",
    description="Performs a web search for a given query and returns a list of search results. Use this for general information gathering beyond academic papers."
)
async def perform_web_search(query: str, num_results: int = 5) -> str:
    """
    Performs a web search using Google Search.
    Args:
        query: The search query string.
        num_results: The number of results to return.
    Returns:
        A string representation of the search results.
    """
    print(f"Performing web search for: '{query}' (num_results: {num_results})...")
    try:
        # This is where you would call your browser-use API if it were integrated.
        # For example:
        # results = await call_browser_use_api("search", {"query": query, "num_results": num_results})

        # Using the available googleWebSearch tool instead:
        from __main__ import default_api # Tool is available in this scope
        results = default_api.googleWebSearch(query=query, num=num_results)

        print(f"Web search results: {json.dumps(results, indent=2)}")
        if not results or "items" not in results or not results["items"]:
            return "No web search results found."

        formatted_results = []
        for item in results["items"][:num_results]: # Ensure we respect num_results
            title = item.get("title", "No title")
            link = item.get("link", "#")
            snippet = item.get("snippet", "No snippet available.")
            formatted_results.append(f"Title: {title}\nLink: {link}\nSnippet: {snippet}")

        return "\n\n-------\n\n".join(formatted_results).strip()

    except Exception as e:
        print(f"Error during web search: {e}")
        return f"An error occurred during the web search: {str(e)}"

# @mcp.tool(
# name="browse_web_page",
# description="Fetches and returns the text content of a given URL. Use this to get detailed information from a specific webpage found via web search."
# )
# async def browse_web_page(url: str) -> str:
#     """
#     Fetches the content of a web page.
#     Args:
#         url: The URL of the web page to browse.
#     Returns:
#         The text content of the web page, or an error message.
#     """
#     print(f"Browsing web page: '{url}'...")
#     try:
#         # This is where you would call your browser-use API for browsing.
#         # For example:
#         # content = await call_browser_use_api("browse", {"url": url})
#         # return content.get("text_content", "Could not extract text content.")

#         # Using the available browse tool instead:
#         from __main__ import default_api # Tool is available in this scope
#         browse_result = default_api.browse(url=url)
#         print(f"Browse result: {json.dumps(browse_result, indent=2)}")
#         content = browse_result.get("content", "Could not extract text content from URL.")
#         # Limit content length for practicality in this example
#         max_length = 4000
#         if len(content) > max_length:
#             content = content[:max_length] + "\n[...content truncated...]"
#         return content
#     except Exception as e:
#         print(f"Error browsing web page: {e}")
#         return f"An error occurred while browsing the web page: {str(e)}"

if __name__ == "__main__":
    # To make default_api.googleWebSearch available in the tool function's scope
    # when running directly, we need a way to pass it.
    # For simplicity in this standalone script, we'll assume it's globally available
    # if this script is run in an environment where the tool executor injects it.
    # When run via MCP, the MCP framework handles tool availability.
    # For direct execution testing, you might need to mock/provide `default_api`.

    # Mock default_api for standalone testing if needed
    class MockDefaultApi:
        def googleWebSearch(self, query: str, num: int | None = None, start: int | None = None) -> dict:
            print(f"[Mock] googleWebSearch called with query: {query}, num: {num}")
            # Return a structure similar to the actual API for testing
            return {
                "items": [
                    {"title": f"Mock Result 1 for {query}", "link": "http://example.com/1", "snippet": "This is a mock snippet for result 1."},
                    {"title": f"Mock Result 2 for {query}", "link": "http://example.com/2", "snippet": "This is a mock snippet for result 2."},
                ]
            }
        def browse(self, url: str, enforce_crawl: bool | None = None) -> dict:
            print(f"[Mock] browse called with url: {url}")
            return {"title": "Mock Page Title", "content": f"Mock content for URL: {url}. This is some sample text."}

    # If 'default_api' is not already in the global scope (e.g., when running this script directly)
    if 'default_api' not in globals():
        print("Mocking default_api for web_search_server.py direct execution.")
        global default_api
        default_api = MockDefaultApi()

    asyncio.run(mcp.run_sse_async())
```

**5. `graph.py`** (New file to define the LangGraph agent)

```python
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

def make_graph(model: ChatOpenAI, tools: list):
    """
    Creates a ReAct agent graph.
    """
    system_prompt = """You are a highly intelligent research assistant. Your goal is to generate a comprehensive Deep Research Report in Markdown format based on the user's query.

You have access to the following tools:
- `search_arxiv`: To find academic papers on ArXiv.
- `extract_article_content`: To get the full text of a PDF article from its URL.
- `get_article_preview`: To get a short preview of a PDF article from its URL.
- `perform_web_search`: To search the general web for information, news, or broader context.
- `browse_web_page`: To get the content of a specific webpage URL.

**Report Generation Process:**

1.  **Understand the Query:** Clearly identify the core research topic and specific questions the user wants answered. If the query is a follow-up, consider the conversation history.
2.  **Information Gathering (Iterative Process):**
    *   Use `search_arxiv` for scholarly articles. Analyze titles and summaries to decide if an article is relevant.
    *   If an ArXiv article seems highly relevant, use `get_article_preview` for a quick look. If it's still promising, use `extract_article_content` to get the full text.
    *   Use `perform_web_search` to gather broader context, definitions, recent news, or non-academic perspectives related to the topic.
    *   If a web search result (a specific URL) seems very important, use `browse_web_page` to get its content.
    *   You may need to use tools multiple times or in combination. For example, search ArXiv, then search the web for a concept mentioned in an ArXiv paper.
3.  **Synthesize Information:** Combine the information gathered from all sources. Identify key findings, different perspectives, and any conflicting information.
4.  **Generate Markdown Report:** Structure your response as a Markdown report. The report should include (but is not limited to) the following sections:

    ```markdown
    # Deep Research Report: [User's Topic]

    ## 1. Introduction
    - Briefly introduce the research topic based on the user's query.
    - State the main objectives of this report.

    ## 2. Methodology
    - Briefly describe the tools and approach used for information gathering (e.g., "Searched ArXiv for academic papers, performed web searches for broader context, and analyzed relevant documents.").

    ## 3. Findings from ArXiv
    - Summarize key findings from relevant ArXiv papers.
    - Include titles, authors (if available in snippets), and key takeaways. Cite PDF URLs.
    - If no relevant ArXiv papers were found, state that.

    ## 4. Findings from Web Search
    - Summarize key information, definitions, news, or other relevant data obtained from web searches.
    - Cite source URLs.
    - If no significant web search findings, state that.

    ## 5. Document Analysis (if applicable)
    - If specific documents (PDFs or web pages) were analyzed in depth, summarize their content and relevance here.
    - Cite the source URLs.

    ## 6. Synthesis and Discussion
    - Combine and synthesize the information from all sources.
    - Discuss the key insights, connections between different pieces of information, and any patterns observed.
    - If there are different viewpoints or conflicting data, present them.

    ## 7. Conclusion
    - Briefly summarize the main findings of the report.
    - Answer the user's original query as comprehensively as possible based on the research.
    - You may suggest potential next steps or areas for further research if appropriate.

    ## 8. References
    - List all ArXiv PDF URLs and Web Page URLs cited in the report.
    ```

5.  **Interaction:**
    *   If the user's query is vague, ask clarifying questions before proceeding with extensive research.
    *   Think step-by-step. For each step, explain what you are trying to achieve and which tool you are using.
    *   When you have gathered enough information and synthesized it, present the full Markdown report.
    *   If you cannot find relevant information using the tools, clearly state that and explain the limitations.

**Important Notes:**
*   Be methodical. Show your thought process.
*   Ensure the final output is a single, complete Markdown report.
*   If the user provides conversation history, use it to understand the context of the current request. The history will be in the format:
    User: [user's message]
    Assistant: [your previous response]
    User: [current user message]
*   Focus on providing a structured and informative report.
*   If a tool returns an error or no useful information, acknowledge it and try a different approach or tool if appropriate.
"""
    # The create_react_agent will internally use a prompt that includes the system message,
    # human message, and placeholders for agent_scratchpad.
    # We are providing a more detailed system prompt here.
    # The agent needs to be able to handle chat history.
    # LangGraph's create_react_agent handles this by taking "messages" as input,
    # where messages can be a list of [HumanMessage, AIMessage, HumanMessage, ...]

    agent_executor = create_react_agent(model, tools, messages_modifier=system_prompt)
    return agent_executor
```

**6. `client_server.py`** (Modified from user's provided code)

```python
import os
from typing import Dict, Any, List

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
# from langgraph.prebuilt import create_react_agent # We use our custom graph
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

# Import the graph constructor
from graph import make_graph


class ResearchRequest(BaseModel):
    messages: List[Dict[str, str]] # Expecting a list of {"role": "user/assistant", "content": "..."}

# Load environment variables from .env file
load_dotenv()

# Ensure environment variables are set
required_env_vars = ['MODEL', 'API_KEY']
for var in required_env_vars:
    if var not in os.environ:
        raise EnvironmentError(f"Missing required environment variable: {var}. Please create a .env file.")

# Optional BASE_URL
base_url = os.environ.get('BASE_URL')

model = ChatOpenAI(
    model=os.environ['MODEL'],
    api_key=os.environ['API_KEY'],
    base_url=base_url if base_url else None,
    temperature=0.1 # Lower temperature for more factual report generation
)

app = FastAPI(title="Deep Research Report API")

# Initialize MCP client and agent globally or cache them if appropriate
# For simplicity, we'll re-initialize per request, but in production, consider optimization.
async def get_mcp_tools():
    mcp_client = MultiServerMCPClient({
        "arxiv": {
            "url": os.environ.get("ARXIV_MCP_URL", "http://localhost:8000/sse"),
            "transport": "sse",
        },
        "docling": {
            "url": os.environ.get("DOCLING_MCP_URL", "http://localhost:8001/sse"),
            "transport": "sse",
        },
        "web_search": {
            "url": os.environ.get("WEB_SEARCH_MCP_URL", "http://localhost:8002/sse"),
            "transport": "sse",
        }
    })
    # The client needs to be entered to initialize connections before getting tools
    async with mcp_client as client:
        tools = await client.get_tools()
    return tools, mcp_client # Return client to manage its lifecycle if needed, or just tools


async def process_research_request(messages_history: List[Dict[str, str]]) -> Dict[str, Any]:
    tools, mcp_client_instance = await get_mcp_tools() # Get tools and the client instance

    # The make_graph function from graph.py creates our ReAct agent
    agent_executor = make_graph(model, tools)

    # Convert message history to LangChain BaseMessage objects
    langchain_messages: List[BaseMessage] = []
    for msg in messages_history:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langchain_messages.append(AIMessage(content=msg["content"]))
        # Add other roles if necessary, e.g., SystemMessage, but our prompt handles that

    if not langchain_messages:
        return {"error": "No messages provided"}

    # The agent expects a dictionary with a "messages" key
    # The content of "messages" should be a list of LangChain message objects.
    # The last message should typically be a HumanMessage.
    input_payload = {"messages": langchain_messages}

    print(f"Invoking agent with payload: {input_payload}")

    try:
        # The mcp_client_instance context needs to be active when tools are called by the agent
        async with mcp_client_instance:
            response = await agent_executor.ainvoke(input_payload, {"debug": False, "recursion_limit": 15})
    except Exception as e:
        print(f"Error invoking agent: {e}")
        return {"error": f"Agent invocation failed: {str(e)}"}


    # The response from a LangGraph agent (especially create_react_agent)
    # usually has the final answer in response['messages'][-1].content
    # Let's ensure we extract the relevant part.
    # The 'messages' key in the response contains the full history including agent steps.
    # The last message is typically the AI's final response.
    final_response_messages = response.get("messages", [])
    output_messages = []
    if final_response_messages:
        # We are interested in the agent's final answer to the user.
        # The create_react_agent typically appends AIMessage for the final answer.
        # Let's find the last AIMessage that is not a tool call.
        final_ai_message_content = ""
        for msg in reversed(final_response_messages):
            if isinstance(msg, AIMessage) and not msg.tool_calls and not msg.invalid_tool_calls:
                final_ai_message_content = msg.content
                break
        if not final_ai_message_content and final_response_messages: # Fallback if no clean AIMessage found
             # The last message in the list is the most recent one.
            last_message = final_response_messages[-1]
            if isinstance(last_message, AIMessage):
                final_ai_message_content = last_message.content
            elif isinstance(last_message, HumanMessage): # Should not happen if agent worked
                final_ai_message_content = "Agent did not produce an AI message. Last message was human."
            else:
                final_ai_message_content = str(last_message)


        output_messages = [{"role": "assistant", "content": final_ai_message_content}]
    else:
        output_messages = [{"role": "assistant", "content": "No response generated by the agent."}]

    return {"messages": output_messages}


@app.post("/research")
async def research(request: ResearchRequest):
    """
    Processes a research query using ArXiv, document analysis, and web search tools,
    and returns a Markdown report.
    Accepts a list of messages representing the conversation history.
    """
    if not request.messages:
        return {"error": "Messages list cannot be empty."}
    return await process_research_request(request.messages)


if __name__ == '__main__':
    # Ensure .env is loaded if running directly
    if not os.getenv("API_KEY"):
        print("Warning: API_KEY not found in environment. Ensure .env file is present and loaded.")
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

**7. `streamlit_app.py`** (Modified from user's provided code to handle new message format)

```python
import datetime
import requests
import streamlit as st
import json # For debugging

# Function to query the research API
def query_research_assistant(message_history: list):
    try:
        # The API now expects a list of message objects
        payload = {"messages": message_history}
        # print(f"Sending to API: {json.dumps(payload, indent=2)}") # Debug: görmek için
        response = requests.post(
            # f"http://client-server:8080/research", # For Docker
            "http://localhost:8080/research", # For local run
            headers={'accept': 'application/json', 'Content-Type': 'application/json'},
            json=payload # Send the whole history
        )
        response.raise_for_status() # Raise an exception for HTTP errors
        # print(f"Received from API: {response.text}") # Debug: görmek için
        return response.json()

    except requests.exceptions.HTTPError as http_err:
        st.error(f"HTTP error occurred: {http_err} - {response.text}")
        return None
    except requests.exceptions.RequestException as e:
        st.error(f"Error connecting to API: {e}")
        return None
    except json.JSONDecodeError as e:
        st.error(f"Error decoding JSON response from API: {e}")
        st.error(f"Raw response: {response.text if 'response' in locals() else 'No response object'}")
        return None


def main():
    # Set up the page
    st.set_page_config(page_title="Deep Research Report Assistant", layout="wide")
    st.title("Deep Research Report Assistant")
    st.markdown("Ask a research question to generate a comprehensive Markdown report.")

    # Initialize chat history structure
    if "chats" not in st.session_state:
        st.session_state.chats = {
            1: {"title": "New Chat", "messages": []} # messages will be [{"role": "user/assistant", "content": "..."}]
        }

    # Track the current active chat ID
    if "active_chat_id" not in st.session_state:
        st.session_state.active_chat_id = 1

    # Track the next chat ID to assign
    if "next_chat_id" not in st.session_state:
        st.session_state.next_chat_id = 2

    # Sidebar for navigation
    with st.sidebar:
        # New chat button
        if st.button("➕ New Research Chat", key="new_chat_btn", use_container_width=True):
            # Create a new chat
            new_id = st.session_state.next_chat_id
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            st.session_state.chats[new_id] = {
                "title": f"Research {new_id} ({timestamp})",
                "messages": []
            }
            st.session_state.active_chat_id = new_id
            st.session_state.next_chat_id += 1
            st.rerun()

        # Show clear chat button for current chat
        if st.button("🗑️ Clear Current Chat", key="clear_chat_btn", use_container_width=True):
            st.session_state.chats[st.session_state.active_chat_id]["messages"] = []
            st.rerun()

        st.divider()
        st.write("### Your Research Chats")

        # Create a list of chat options for the radio buttons
        chat_options = {chat_id: chat_data["title"] for chat_id, chat_data in st.session_state.chats.items()}

        # Use radio buttons for chat selection instead of buttons
        # Ensure active_chat_id is a valid key before trying to get its index
        active_chat_id_str = str(st.session_state.active_chat_id)
        chat_keys_list = list(chat_options.keys())

        if st.session_state.active_chat_id not in chat_keys_list : # if current chat was deleted or is invalid
             if chat_keys_list:
                 st.session_state.active_chat_id = chat_keys_list[0] # select first available
             else: # no chats exist, create one (should be handled by init but as a safe guard)
                st.session_state.active_chat_id = 1
                st.session_state.chats[1] = {"title": "New Chat", "messages": []}
                st.session_state.next_chat_id = 2
                chat_options = {1: "New Chat"}
                chat_keys_list = [1]


        selected_chat_key = st.radio(
            "Select a chat:",
            options=chat_keys_list,
            format_func=lambda x: chat_options[x],
            label_visibility="collapsed",
            key=f"chat_selector_{st.session_state.active_chat_id}" # Dynamic key to force re-render
        )

        # Update active chat ID when selection changes
        if selected_chat_key is not None and int(selected_chat_key) != st.session_state.active_chat_id:
            st.session_state.active_chat_id = int(selected_chat_key)
            st.rerun()

    # Get current chat data
    current_chat = st.session_state.chats[st.session_state.active_chat_id]
    current_messages_history = current_chat["messages"]

    # Display all messages in the current chat
    for message in current_messages_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Ask your research question or provide further instructions..."):
        # Add user message to chat history
        current_messages_history.append({"role": "user", "content": prompt})

        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)

        # Process response
        with st.chat_message("assistant"):
            with st.spinner("👩‍🔬 Conducting research and drafting report... This may take a moment."):
                # Send the entire current message history to the backend
                api_response = query_research_assistant(current_messages_history)

                if api_response and "messages" in api_response and api_response["messages"]:
                    # The API should return a list of messages, but we expect one assistant message
                    assistant_message_content = api_response["messages"][0]["content"]
                    st.markdown(assistant_message_content)
                    # Add assistant's response to chat history
                    current_messages_history.append({"role": "assistant", "content": assistant_message_content})
                elif api_response and "error" in api_response:
                    st.error(f"API Error: {api_response['error']}")
                    # Optionally remove the last user message if the call failed, or keep it for context
                else:
                    st.error("Received an empty or unexpected response from the research assistant.")

    st.sidebar.divider()
    st.sidebar.caption("Deep Research Report Assistant v1.0")


if __name__ == '__main__':
    main()
```

**8. `requirements.txt`** (Updated from user's provided code)

```
langgraph
arxiv
mcp
pydantic
langchain_mcp_adapters
langchain-openai # Updated from langchain_openai
python-dotenv # Updated from dotenv
fastapi
uvicorn
docling
langchain-text-splitters # Updated from langchain_text_splitters
tiktoken
streamlit
httpx # For potential browser-use integration and robust HTTP calls
langchain-core # Explicitly add for BaseMessage etc.
```

**9. `langgraph.json`** (Using the code provided by the user)

```json
{
    "dependencies": ["."],
    "graphs": {
      "agent": "./graph.py:make_graph"
    }
}
```

**10. `.env.example`** (New file - user should rename to `.env` and fill in values)

```
MODEL="your_openai_model_name_eg_gpt-4-turbo"
API_KEY="your_openai_api_key"
BASE_URL="your_openai_base_url_if_needed_otherwise_leave_empty"

# Optional: If your MCP servers are not on localhost or default ports
# ARXIV_MCP_URL="http://arxiv-server-hostname:8000/sse"
# DOCLING_MCP_URL="http://docling-server-hostname:8001/sse"
# WEB_SEARCH_MCP_URL="http://websearch-server-hostname:8002/sse"
```

**To make this system runnable, you would:**

1.  **Create a `.env` file** in the root directory from `.env.example` and add your OpenAI API key and model details.
2.  **Install all dependencies:** `pip install -r requirements.txt`
3.  **Run the MCP servers** (each in a separate terminal):
    ```bash
    python arxiv_server.py
    python docling_server.py
    python web_search_server.py
    ```
4.  **Run the Client Server (FastAPI + LangGraph)** (in a separate terminal):
    ```bash
    python client_server.py
    ```
5.  **Run the Streamlit UI** (in a separate terminal):
    ```bash
    streamlit run
    ```