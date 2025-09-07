I'll help you develop a Deep Research Report generation system based on the provided project structure and source code. Let's analyze the requirements and create a comprehensive solution.

## Understanding the Project Requirements

You need a system that:
1. Uses MCP, LangGraph, FastAPI, and Streamlit
2. Leverages browser-use for web browsing and research
3. Conducts multi-round conversations to understand tasks
4. Generates complete research reports in Markdown format

Let me explore the reference materials first to understand how to integrate browser-use.Now let's look at the web-ui repository to understand how to integrate it with our project:Let's look at the main browser-use repository to better understand how to use it:Now I have a better understanding of the browser-use library and how it can be integrated into our project. Let's design the Deep Research Report generation system.

## Project Design

Based on the provided project structure and the requirements, I'll create a Deep Research Report generation system that:

1. Uses MCP for tool integration
2. Leverages LangGraph for workflow orchestration
3. Implements FastAPI for backend services
4. Uses Streamlit for the user interface
5. Integrates browser-use for web browsing and research

Let's start by designing the architecture and then implement each component.

### Architecture Overview

The system will consist of the following components:

1. **MCP Servers**:
   - **Browser Server**: Provides tools for web browsing and research using browser-use
   - **Document Server**: Handles document processing and extraction

2. **LangGraph Agent**:
   - Orchestrates the research workflow
   - Manages multi-turn conversations
   - Generates the final report

3. **FastAPI Backend**:
   - Coordinates between the MCP servers and the frontend
   - Exposes endpoints for the Streamlit UI

4. **Streamlit UI**:
   - User-friendly interface for submitting research tasks
   - Displays research progress and final reports

Now let's implement each component.

## Implementation

Let's start by creating the necessary files for our project:

### 1. First, let's create the browser_server.py file:

```python
# browser_server.py
import asyncio
import os
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from mcp.server.fastmcp import FastMCP
from browser_use import Agent as BrowserAgent
from browser_use.agent.views import ActionResult
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Browser Research Provider", port=8000)

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

    def __str__(self):
        return f"Title: {self.title}\nURL: {self.url}\nSnippet: {self.snippet}\n"

class WebContent(BaseModel):
    url: str
    title: str
    content: str
    timestamp: str

@mcp.tool(
    name="web_search",
    description="Performs a web search using a search engine and returns the results."
)
async def web_search(query: str, num_results: int = 5) -> str:
    """
    Perform a web search using the browser and return the search results.
    
    Args:
        query: The search query
        num_results: The number of results to return (default: 5)
        
    Returns:
        A string containing the search results
    """
    try:
        # Initialize the browser agent
        llm = ChatOpenAI(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            temperature=0
        )
        
        # Create a task for the browser agent
        search_task = f"Search for '{query}' and return the top {num_results} results with their titles, URLs, and brief descriptions."
        
        # Run the browser agent
        agent = BrowserAgent(
            task=search_task,
            llm=llm,
            headless=True  # Run browser in headless mode
        )
        
        result = await agent.run()
        
        # Process and format the results
        return result
    except Exception as e:
        return f"Error performing web search: {str(e)}"

@mcp.tool(
    name="browse_webpage",
    description="Browses a webpage and extracts its content."
)
async def browse_webpage(url: str) -> str:
    """
    Browse a webpage and extract its content.
    
    Args:
        url: The URL of the webpage to browse
        
    Returns:
        A string containing the content of the webpage
    """
    try:
        # Initialize the browser agent
        llm = ChatOpenAI(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            temperature=0
        )
        
        # Create a task for the browser agent
        browse_task = f"Go to {url} and extract the main content of the page. Return the title and the main content in a structured format."
        
        # Run the browser agent
        agent = BrowserAgent(
            task=browse_task,
            llm=llm,
            headless=True  # Run browser in headless mode
        )
        
        result = await agent.run()
        
        return result
    except Exception as e:
        return f"Error browsing webpage: {str(e)}"

@mcp.tool(
    name="extract_specific_information",
    description="Extracts specific information from a webpage based on a query."
)
async def extract_specific_information(url: str, query: str) -> str:
    """
    Extract specific information from a webpage based on a query.
    
    Args:
        url: The URL of the webpage
        query: The specific information to extract
        
    Returns:
        A string containing the extracted information
    """
    try:
        # Initialize the browser agent
        llm = ChatOpenAI(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            temperature=0
        )
        
        # Create a task for the browser agent
        extract_task = f"Go to {url} and extract information about '{query}'. Return the information in a clear, structured format."
        
        # Run the browser agent
        agent = BrowserAgent(
            task=extract_task,
            llm=llm,
            headless=True  # Run browser in headless mode
        )
        
        result = await agent.run()
        
        return result
    except Exception as e:
        return f"Error extracting information: {str(e)}"

@mcp.tool(
    name="take_screenshot",
    description="Takes a screenshot of a webpage."
)
async def take_screenshot(url: str, save_path: str = "screenshots") -> str:
    """
    Take a screenshot of a webpage.
    
    Args:
        url: The URL of the webpage
        save_path: The directory to save the screenshot (default: 'screenshots')
        
    Returns:
        A string containing the path to the saved screenshot
    """
    try:
        # Initialize the browser agent
        llm = ChatOpenAI(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
            temperature=0
        )
        
        # Create a task for the browser agent
        screenshot_task = f"Go to {url} and take a screenshot of the entire page. Save it to {save_path}."
        
        # Run the browser agent
        agent = BrowserAgent(
            task=screenshot_task,
            llm=llm,
            headless=True  # Run browser in headless mode
        )
        
        result = await agent.run()
        
        return result
    except Exception as e:
        return f"Error taking screenshot: {str(e)}"

if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
```

### 2. Now, let's create the document_server.py file:

```python
# document_server.py
import asyncio
import os
import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from mcp.server.fastmcp import FastMCP
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tiktoken
import markdown
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Document Processing Provider", port=8001)

class Document(BaseModel):
    content: str
    metadata: Dict[str, Any] = {}

def first_chunk(text: str, chunk_size: int = 4000) -> str:
    """Get the first chunk of text based on token count."""
    encoder = tiktoken.encoding_for_model('gpt-4')
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=0,
        length_function=lambda x: len(encoder.encode(x)),
        is_separator_regex=False,
    )
    return text_splitter.split_text(text)[0]

@mcp.tool(
    name="format_markdown",
    description="Formats text as clean markdown with proper headings, lists, and code blocks."
)
async def format_markdown(content: str) -> str:
    """
    Format text as clean markdown with proper headings, lists, and code blocks.
    
    Args:
        content: The text content to format
        
    Returns:
        A string containing the formatted markdown
    """
    try:
        # Basic markdown formatting improvements
        # Ensure proper heading formatting
        content = re.sub(r'^(?!#)(.+)\n={3,}$', r'# \1', content, flags=re.MULTILINE)
        content = re.sub(r'^(?!#)(.+)\n-{3,}$', r'## \1', content, flags=re.MULTILINE)
        
        # Ensure proper list formatting
        content = re.sub(r'^(\s*)\*\s', r'\1* ', content, flags=re.MULTILINE)
        content = re.sub(r'^(\s*)-\s', r'\1- ', content, flags=re.MULTILINE)
        content = re.sub(r'^(\s*)\d+\.\s', r'\1\1. ', content, flags=re.MULTILINE)
        
        # Ensure proper code block formatting
        content = re.sub(r'```(\w+)(?!\n)', r'```\1\n', content)
        content = re.sub(r'(?<!\n)```', r'\n```', content)
        
        return content
    except Exception as e:
        return f"Error formatting markdown: {str(e)}"

@mcp.tool(
    name="extract_key_points",
    description="Extracts key points from a document."
)
async def extract_key_points(content: str, max_points: int = 10) -> str:
    """
    Extract key points from a document.
    
    Args:
        content: The document content
        max_points: The maximum number of key points to extract (default: 10)
        
    Returns:
        A string containing the extracted key points
    """
    try:
        # Simple extraction of key points based on headings and lists
        lines = content.split('\n')
        key_points = []
        
        for line in lines:
            # Extract headings
            if line.startswith('#'):
                key_points.append(line.strip('# '))
            # Extract list items
            elif line.strip().startswith('* ') or line.strip().startswith('- ') or re.match(r'^\d+\.\s', line.strip()):
                key_points.append(line.strip())
                
        # Limit to max_points
        key_points = key_points[:max_points]
        
        return '\n'.join(key_points)
    except Exception as e:
        return f"Error extracting key points: {str(e)}"

@mcp.tool(
    name="generate_table_of_contents",
    description="Generates a table of contents from markdown headings."
)
async def generate_table_of_contents(content: str) -> str:
    """
    Generate a table of contents from markdown headings.
    
    Args:
        content: The markdown content
        
    Returns:
        A string containing the table of contents
    """
    try:
        lines = content.split('\n')
        toc = ["# Table of Contents"]
        
        for line in lines:
            if line.startswith('#'):
                level = len(re.match(r'^#+', line).group(0))
                title = line.strip('# ')
                indent = '  ' * (level - 1)
                toc.append(f"{indent}- [{title}](#{title.lower().replace(' ', '-')})")
                
        return '\n'.join(toc)
    except Exception as e:
        return f"Error generating table of contents: {str(e)}"

@mcp.tool(
    name="create_report_template",
    description="Creates a template for a research report with standard sections."
)
async def create_report_template(title: str, sections: Optional[List[str]] = None) -> str:
    """
    Create a template for a research report with standard sections.
    
    Args:
        title: The title of the report
        sections: Optional list of custom sections (default: None)
        
    Returns:
        A string containing the report template
    """
    try:
        if sections is None:
            sections = [
                "Executive Summary",
                "Introduction",
                "Background",
                "Methodology",
                "Findings",
                "Analysis",
                "Conclusions",
                "Recommendations",
                "References"
            ]
            
        template = [f"# {title}", ""]
        template.append("## Table of Contents")
        template.append("")
        
        for section in sections:
            template.append(f"## {section}")
            template.append("")
            template.append("*Content for this section goes here.*")
            template.append("")
            
        # Add metadata
        template.append("---")
        template.append(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        template.append("")
        
        return '\n'.join(template)
    except Exception as e:
        return f"Error creating report template: {str(e)}"

if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
```

### 3. Now, let's create the graph.py file for LangGraph:

```python
# graph.py
import os
from typing import Dict, List, Any, Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
import operator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define state
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    research_topic: str
    research_stage: str
    collected_data: Dict[str, Any]
    report_outline: Dict[str, Any]
    report_draft: str
    final_report: str

def make_graph():
    # Initialize LLM
    llm = ChatOpenAI(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
        temperature=0.2
    )
    
    # Initialize MCP client
    mcp_client = MultiServerMCPClient({
        "browser": {
            "url": "http://localhost:8000/sse",
            "transport": "sse",
        },
        "document": {
            "url": "http://localhost:8001/sse",
            "transport": "sse",
        }
    })
    
    # Create tool node
    tool_node = ToolNode(llm=llm, tools=mcp_client.get_tools())
    
    # Define prompt templates
    research_planner_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research planning assistant. Your task is to help plan the research process for a given topic.
        
        Based on the current research stage and the conversation history, determine the next steps in the research process.
        
        The research stages are:
        1. Topic Analysis - Break down the research topic into key questions and areas to explore
        2. Information Gathering - Collect relevant information from various sources
        3. Data Analysis - Analyze the collected information
        4. Report Outlining - Create a structured outline for the report
        5. Report Drafting - Write the initial draft of the report
        6. Report Finalization - Finalize the report with proper formatting and citations
        
        For each stage, recommend specific actions to take and tools to use.
        """),
        MessagesPlaceholder(variable_name="messages"),
        ("human", """
        Research Topic: {research_topic}
        Current Stage: {research_stage}
        
        Based on the conversation history and current stage, what should be the next steps in the research process?
        """)
    ])
    
    topic_analyzer_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research topic analyzer. Your task is to analyze a research topic and break it down into key questions, subtopics, and areas to explore.
        
        For the given research topic, provide:
        1. A clear definition of the topic
        2. Key questions to answer
        3. Subtopics to explore
        4. Potential sources of information
        5. Relevant keywords for searching
        
        Be thorough and systematic in your analysis.
        """),
        MessagesPlaceholder(variable_name="messages"),
        ("human", "Analyze the following research topic: {research_topic}")
    ])
    
    report_outliner_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a report structure expert. Your task is to create a detailed outline for a research report.
        
        Based on the research topic and the information collected so far, create a comprehensive outline for the report with:
        1. Main sections and subsections
        2. Key points to cover in each section
        3. Logical flow of information
        4. Suggestions for visual elements (charts, tables, etc.)
        
        The outline should be detailed enough to guide the report writing process.
        """),
        MessagesPlaceholder(variable_name="messages"),
        ("human", """
        Research Topic: {research_topic}
        Collected Information: {collected_data}
        
        Create a detailed outline for the research report.
        """)
    ])
    
    report_drafter_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a research report writer. Your task is to draft a comprehensive research report based on the provided outline and collected information.
        
        The report should be:
        1. Well-structured following the outline
        2. Comprehensive, covering all aspects of the topic
        3. Well-written with clear explanations
        4. Properly formatted in Markdown
        5. Include citations where appropriate
        
        Write the report in sections according to the outline.
        """),
        MessagesPlaceholder(variable_name="messages"),
        ("human", """
        Research Topic: {research_topic}
        Report Outline: {report_outline}
        Collected Information: {collected_data}
        
        Draft the research report following the outline.
        """)
    ])
    
    report_finalizer_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a report editor and finalizer. Your task is to review and finalize a research report draft.
        
        Improve the report by:
        1. Ensuring logical flow and coherence
        2. Checking for completeness of information
        3. Enhancing clarity and readability
        4. Ensuring proper formatting in Markdown
        5. Adding a table of contents
        6. Adding an executive summary
        7. Adding proper citations and references
        
        The final report should be publication-ready.
        """),
        MessagesPlaceholder(variable_name="messages"),
        ("human", """
        Research Topic: {research_topic}
        Report Draft: {report_draft}
        
        Finalize the research report.
        """)
    ])
    
    # Create chains
    research_planner_chain = research_planner_prompt | llm | StrOutputParser()
    topic_analyzer_chain = topic_analyzer_prompt | llm | StrOutputParser()
    report_outliner_chain = report_outliner_prompt | llm | StrOutputParser()
    report_drafter_chain = report_drafter_prompt | llm | StrOutputParser()
    report_finalizer_chain = report_finalizer_prompt | llm | StrOutputParser()
    
    # Define state handlers
    def research_planner(state: AgentState) -> Dict:
        """Plan the next steps in the research process."""
        messages = state["messages"]
        research_topic = state["research_topic"]
        research_stage = state["research_stage"]
        
        response = research_planner_chain.invoke({
            "messages": messages,
            "research_topic": research_topic,
            "research_stage": research_stage
        })
        
        return {
            "messages": messages + [AIMessage(content=response)]
        }
    
    def topic_analyzer(state: AgentState) -> Dict:
        """Analyze the research topic."""
        messages = state["messages"]
        research_topic = state["research_topic"]
        
        response = topic_analyzer_chain.invoke({
            "messages": messages,
            "research_topic": research_topic
        })
        
        # Update collected data
        collected_data = state["collected_data"]
        collected_data["topic_analysis"] = response
        
        return {
            "messages": messages + [AIMessage(content=response)],
            "collected_data": collected_data,
            "research_stage": "Information Gathering"
        }
    
    def report_outliner(state: AgentState) -> Dict:
        """Create an outline for the report."""
        messages = state["messages"]
        research_topic = state["research_topic"]
        collected_data = state["collected_data"]
        
        response = report_outliner_chain.invoke({
            "messages": messages,
            "research_topic": research_topic,
            "collected_data": collected_data
        })
        
        # Update report outline
        report_outline = {"outline": response}
        
        return {
            "messages": messages + [AIMessage(content=response)],
            "report_outline": report_outline,
            "research_stage": "Report Drafting"
        }
    
    def report_drafter(state: AgentState) -> Dict:
        """Draft the research report."""
        messages = state["messages"]
        research_topic = state["research_topic"]
        report_outline = state["report_outline"]
        collected_data = state["collected_data"]
        
        response = report_drafter_chain.invoke({
            "messages": messages,
            "research_topic": research_topic,
            "report_outline": report_outline,
            "collected_data": collected_data
        })
        
        return {
            "messages": messages + [AIMessage(content=response)],
            "report_draft": response,
            "research_stage": "Report Finalization"
        }
    
    def report_finalizer(state: AgentState) -> Dict:
        """Finalize the research report."""
        messages = state["messages"]
        research_topic = state["research_topic"]
        report_draft = state["report_draft"]
        
        response = report_finalizer_chain.invoke({
            "messages": messages,
            "research_topic": research_topic,
            "report_draft": report_draft
        })
        
        return {
            "messages": messages + [AIMessage(content=response)],
            "final_report": response,
            "research_stage": "Completed"
        }
    
    # Define routing logic
    def should_use_tools(state: AgentState) -> str:
        """Determine if tools should be used based on the research stage."""
        research_stage = state["research_stage"]
        
        if research_stage in ["Topic Analysis", "Information Gathering", "Data Analysis"]:
            return "use_tools"
        elif research_stage == "Report Outlining":
            return "report_outliner"
        elif research_stage == "Report Drafting":
            return "report_drafter"
        elif research_stage == "Report Finalization":
            return "report_finalizer"
        else:
            return "research_planner"
    
    def after_tools(state: AgentState) -> str:
        """Determine the next step after using tools."""
        research_stage = state["research_stage"]
        
        if research_stage == "Topic Analysis":
            return "topic_analyzer"
        elif research_stage == "Information Gathering":
            # Check if enough information has been collected
            collected_data = state["collected_data"]
            if len(collected_data.get("web_search_results", [])) >= 3:
                return "data_analyzer"
            else:
                return "use_tools"
        elif research_stage == "Data Analysis":
            return "report_outliner"
        else:
            return "research_planner"
    
    def is_research_complete(state: AgentState) -> str:
        """Check if the research is complete."""
        if state["research_stage"] == "Completed":
            return END
        else:
            return "research_planner"
    
    # Create the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("research_planner", research_planner)
    workflow.add_node("topic_analyzer", topic_analyzer)
    workflow.add_node("use_tools", tool_node)
    workflow.add_node("report_outliner", report_outliner)
    workflow.add_node("report_drafter", report_drafter)
    workflow.add_node("report_finalizer", report_finalizer)
    
    # Add edges
    workflow.add_conditional_edges(
        "research_planner",
        should_use_tools,
        {
            "use_tools": "use_tools",
            "topic_analyzer": "topic_analyzer",
            "report_outliner": "report_outliner",
            "report_drafter": "report_drafter",
            "report_finalizer": "report_finalizer",
            "research_planner": "research_planner"
        }
    )
    
    workflow.add_conditional_edges(
        "use_tools",
        after_tools,
        {
            "topic_analyzer": "topic_analyzer",
            "data_analyzer": "report_outliner",
            "use_tools": "use_tools",
            "research_planner": "research_planner"
        }
    )
    
    workflow.add_edge("topic_analyzer", "research_planner")
    workflow.add_edge("report_outliner", "report_drafter")
    workflow.add_edge("report_drafter", "report_finalizer")
    
    workflow.add_conditional_edges(
        "report_finalizer",
        is_research_complete,
        {
            END: END,
            "research_planner": "research_planner"
        }
    )
    
    # Set entry point
    workflow.set_entry_point("research_planner")
    
    return workflow.compile()
```

### 4. Now, let's create the client_server.py file:

```python
# client_server.py
import os
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from graph import make_graph
from dotenv import load_dotenv
import uvicorn
import uuid
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Deep Research Report Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM
llm = ChatOpenAI(
    model=os.environ.get("OPENAI_MODEL", "gpt-4o"),
    temperature=0.2
)

# Store active research sessions
research_sessions = {}

class ResearchRequest(BaseModel):
    topic: str
    description: Optional[str] = None

class ResearchUpdate(BaseModel):
    session_id: str
    message: str

class ResearchResponse(BaseModel):
    session_id: str
    status: str
    messages: List[Dict[str, str]]
    report: Optional[str] = None

# Initialize the research graph
research_graph = make_graph()

async def run_research_session(session_id: str, topic: str, description: Optional[str] = None):
    """Run a research session in the background."""
    try:
        # Initialize the session state
        initial_message = f"I need to research about {topic}."
        if description:
            initial_message += f" Specifically, I want to know: {description}"
        
        # Initialize session state
        session_state = {
            "messages": [HumanMessage(content=initial_message)],
            "research_topic": topic,
            "research_stage": "Topic Analysis",
            "collected_data": {},
            "report_outline": {},
            "report_draft": "",
            "final_report": ""
        }
        
        # Store the initial state
        research_sessions[session_id]["state"] = session_state
        research_sessions[session_id]["status"] = "in_progress"
        research_sessions[session_id]["messages"].append({
            "role": "system",
            "content": f"Research session started for topic: {topic}"
        })
        
        # Run the research graph
        result = await research_graph.ainvoke(session_state)
        
        # Update the session with the final result
        research_sessions[session_id]["state"] = result
        research_sessions[session_id]["status"] = "completed"
        research_sessions[session_id]["messages"].append({
            "role": "system",
            "content": "Research completed. Final report is ready."
        })
        research_sessions[session_id]["report"] = result.get("final_report", "")
        
        # Save the report to a file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"reports/{session_id}_{timestamp}.md"
        os.makedirs("reports", exist_ok=True)
        with open(filename, "w") as f:
            f.write(result.get("final_report", ""))
        
        research_sessions[session_id]["report_file"] = filename
        
    except Exception as e:
        research_sessions[session_id]["status"] = "error"
        research_sessions[session_id]["messages"].append({
            "role": "system",
            "content": f"Error in research process: {str(e)}"
        })
        print(f"Error in research session {session_id}: {str(e)}")

@app.post("/research/start", response_model=ResearchResponse)
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    """Start a new research session."""
    session_id = str(uuid.uuid4())
    
    # Initialize the session
    research_sessions[session_id] = {
        "topic": request.topic,
        "description": request.description,
        "status": "starting",
        "messages": [
            {
                "role": "user",
                "content": f"I need to research about {request.topic}."
            }
        ],
        "start_time": datetime.now().isoformat(),
        "report": None
    }
    
    # Start the research process in the background
    background_tasks.add_task(
        run_research_session,
        session_id=session_id,
        topic=request.topic,
        description=request.description
    )
    
    return ResearchResponse(
        session_id=session_id,
        status="starting",
        messages=research_sessions[session_id]["messages"],
        report=None
    )

@app.get("/research/{session_id}", response_model=ResearchResponse)
async def get_research_status(session_id: str):
    """Get the status of a research session."""
    if session_id not in research_sessions:
        raise HTTPException(status_code=404, detail="Research session not found")
    
    session = research_sessions[session_id]
    
    return ResearchResponse(
        session_id=session_id,
        status=session["status"],
        messages=session["messages"],
        report=session.get("report", None)
    )

@app.post("/research/{session_id}/update", response_model=ResearchResponse)
async def update_research(session_id: str, update: ResearchUpdate):
    """Update a research session with a new message."""
    if session_id not in research_sessions:
        raise HTTPException(status_code=404, detail="Research session not found")
    
    # Add the message to the session
    research_sessions[session_id]["messages"].append({
        "role": "user",
        "content": update.message
    })
    
    # If the research is still in progress, update the state
    if research_sessions[session_id]["status"] == "in_progress":
        if "state" in research_sessions[session_id]:
            state = research_sessions[session_id]["state"]
            state["messages"].append(HumanMessage(content=update.message))
            research_sessions[session_id]["state"] = state
    
    return ResearchResponse(
        session_id=session_id,
        status=research_sessions[session_id]["status"],
        messages=research_sessions[session_id]["messages"],
        report=research_sessions[session_id].get("report", None)
    )

@app.get("/research/{session_id}/report")
async def get_research_report(session_id: str):
    """Get the final report from a research session."""
    if session_id not in research_sessions:
        raise HTTPException(status_code=404, detail="Research session not found")
    
    if research_sessions[session_id]["status"] != "completed":
        raise HTTPException(status_code=400, detail="Research is not yet completed")
    
    return {"report": research_sessions[session_id].get("report", "")}

@app.get("/research")
async def list_research_sessions():
    """List all research sessions."""
    return {
        "sessions": [
            {
                "session_id": session_id,
                "topic": session["topic"],
                "status": session["status"],
                "start_time": session["start_time"]
            }
            for session_id, session in research_sessions.items()
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 5. Now, let's create the streamlit_app.py file:

```python
# streamlit_app.py
import os
import time
import requests
import streamlit as st
from datetime import datetime
import json

# API endpoint
API_URL = "http://localhost:8080"  # Change to your API URL

def main():
    # Set page config
    st.set_page_config(
        page_title="Deep Research Report Generator",
        page_icon="📚",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize session state
    if "sessions" not in st.session_state:
        st.session_state.sessions = {}
    
    if "active_session_id" not in st.session_state:
        st.session_state.active_session_id = None
    
    if "report_content" not in st.session_state:
        st.session_state.report_content = ""
    
    if "view_mode" not in st.session_state:
        st.session_state.view_mode = "chat"  # Options: "chat", "report"
    
    # Header
    st.title("📚 Deep Research Report Generator")
    st.markdown("Generate comprehensive research reports on any topic using AI-powered web research.")
    
    # Sidebar
    with st.sidebar:
        st.header("Research Sessions")
        
        # Create new research session
        st.subheader("Start New Research")
        with st.form("new_research_form"):
            topic = st.text_input("Research Topic")
            description = st.text_area("Additional Details (optional)")
            start_button = st.form_submit_button("Start Research")
            
            if start_button and topic:
                try:
                    response = requests.post(
                        f"{API_URL}/research/start",
                        json={"topic": topic, "description": description}
                    )
                    if response.status_code == 200:
                        session_data = response.json()
                        session_id = session_data["session_id"]
                        st.session_state.sessions[session_id] = {
                            "topic": topic,
                            "status": "starting",
                            "last_updated": datetime.now().strftime("%H:%M:%S")
                        }
                        st.session_state.active_session_id = session_id
                        st.success(f"Research started on: {topic}")
                        st.rerun()
                    else:
                        st.error(f"Error starting research: {response.text}")
                except Exception as e:
                    st.error(f"Error connecting to API: {str(e)}")
        
        # List existing sessions
        st.subheader("Your Sessions")
        
        # Refresh sessions list
        if st.button("Refresh Sessions"):
            try:
                response = requests.get(f"{API_URL}/research")
                if response.status_code == 200:
                    sessions_data = response.json()["sessions"]
                    for session in sessions_data:
                        session_id = session["session_id"]
                        if session_id not in st.session_state.sessions:
                            st.session_state.sessions[session_id] = {
                                "topic": session["topic"],
                                "status": session["status"],
                                "last_updated": datetime.now().strftime("%H:%M:%S")
                            }
                        else:
                            st.session_state.sessions[session_id]["status"] = session["status"]
                            st.session_state.sessions[session_id]["last_updated"] = datetime.now().strftime("%H:%M:%S")
                    st.success("Sessions refreshed")
                    st.rerun()
                else:
                    st.error(f"Error refreshing sessions: {response.text}")
            except Exception as e:
                st.error(f"Error connecting to API: {str(e)}")
        
        # Display sessions
        for session_id, session in st.session_state.sessions.items():
            col1, col2 = st.columns([3, 1])
            with col1:
                if st.button(
                    f"{session['topic']} ({session['status']})",
                    key=f"session_{session_id}",
                    use_container_width=True
                ):
                    st.session_state.active_session_id = session_id
                    st.session_state.view_mode = "chat"
                    st.rerun()
            with col2:
                if session["status"] == "completed" and st.button(
                    "📄", key=f"report_{session_id}", help="View Report"
                ):
                    st.session_state.active_session_id = session_id
                    st.session_state.view_mode = "report"
                    # Get the report content
                    try:
                        response = requests.get(f"{API_URL}/research/{session_id}/report")
                        if response.status_code == 200:
                            st.session_state.report_content = response.json()["report"]
                        else:
                            st.session_state.report_content = "Error loading report."
                    except Exception as e:
                        st.session_state.report_content = f"Error connecting to API: {str(e)}"
                    st.rerun()
            
            st.caption(f"Last updated: {session['last_updated']}")
            st.divider()
    
    # Main content area
    if st.session_state.active_session_id:
        active_session_id = st.session_state.active_session_id
        
        # Toggle between chat and report views
        if st.session_state.sessions[active_session_id]["status"] == "completed":
            tabs = st.tabs(["Chat", "Report"])
            
            # Chat tab
            with tabs[0]:
                display_chat_interface(active_session_id)
            
            # Report tab
            with tabs[1]:
                display_report_interface(active_session_id)
        else:
            display_chat_interface(active_session_id)
    else:
        st.info("Select an existing research session or start a new one.")
        
        # Display sample topics for quick start
        st.subheader("Quick Start")
        sample_topics = [
            "Artificial Intelligence in Healthcare",
            "Climate Change Mitigation Strategies",
            "Quantum Computing Applications",
            "Sustainable Urban Development",
            "Blockchain Technology in Supply Chain"
        ]
        
        cols = st.columns(len(sample_topics))
        for i, topic in enumerate(sample_topics):
            if cols[i].button(topic, key=f"sample_{i}"):
                try:
                    response = requests.post(
                        f"{API_URL}/research/start",
                        json={"topic": topic}
                    )
                    if response.status_code == 200:
                        session_data = response.json()
                        session_id = session_data["session_id"]
                        st.session_state.sessions[session_id] = {
                            "topic": topic,
                            "status": "starting",
                            "last_updated": datetime.now().strftime("%H:%M:%S")
                        }
                        st.session_state.active_session_id = session_id
                        st.success(f"Research started on: {topic}")
                        st.rerun()
                    else:
                        st.error(f"Error starting research: {response.text}")
                except Exception as e:
                    st.error(f"Error connecting to API: {str(e)}")

def display_chat_interface(session_id):
    """Display the chat interface for a research session."""
    # Get the latest session data
    try:
        response = requests.get(f"{API_URL}/research/{session_id}")
        if response.status_code == 200:
            session_data = response.json()
            messages = session_data["messages"]
            status = session_data["status"]
            
            # Update session status in session state
            st.session_state.sessions[session_id]["status"] = status
            
            # Display status
            if status == "starting":
                st.info("Research is starting...")
            elif status == "in_progress":
                st.info("Research is in progress...")
            elif status == "completed":
                st.success("Research is completed! You can view the full report.")
            elif status == "error":
                st.error("An error occurred during research.")
            
            # Display messages
            for message in messages:
                if message["role"] == "user":
                    with st.chat_message("user"):
                        st.markdown(message["content"])
                elif message["role"] == "assistant":
                    with st.chat_message("assistant"):
                        st.markdown(message["content"])
                elif message["role"] == "system":
                    with st.chat_message("system", avatar="🤖"):
                        st.markdown(message["content"])
            
            # Input for new messages
            if status in ["in_progress", "completed"]:
                user_input = st.chat_input("Ask a follow-up question or provide additional information...")
                if user_input:
                    # Display user message
                    with st.chat_message("user"):
                        st.markdown(user_input)
                    
                    # Send message to API
                    try:
                        update_response = requests.post(
                            f"{API_URL}/research/{session_id}/update",
                            json={"session_id": session_id, "message": user_input}
                        )
                        if update_response.status_code == 200:
                            st.rerun()
                        else:
                            st.error(f"Error sending message: {update_response.text}")
                    except Exception as e:
                        st.error(f"Error connecting to API: {str(e)}")
        else:
            st.error(f"Error getting session data: {response.text}")
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")

def display_report_interface(session_id):
    """Display the report interface for a completed research session."""
    # Get the report content if not already loaded
    if not st.session_state.report_content:
        try:
            response = requests.get(f"{API_URL}/research/{session_id}/report")
            if response.status_code == 200:
                st.session_state.report_content = response.json()["report"]
            else:
                st.error(f"Error loading report: {response.text}")
                return
        except Exception as e:
            st.error(f"Error connecting to API: {str(e)}")
            return
    
    # Display the report
    st.markdown(st.session_state.report_content)
    
    # Download button
    report_filename = f"research_report_{session_id[:8]}.md"
    st.download_button(
        label="Download Report (Markdown)",
        data=st.session_state.report_content,
        file_name=report_filename,
        mime="text/markdown"
    )
    
    # Additional download formats could be added here
    # For example, PDF conversion using a library like weasyprint

if __name__ == "__main__":
    main()
```

### 6. Now, let's create the Docker files:

#### Dockerfile.browser

```dockerfile
# docker/Dockerfile.browser
FROM python:3.10-slim

WORKDIR /app

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    libglib2.0-0 \
    libnss3 \
    libgconf-2-4 \
    libfontconfig1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libxrandr2 \
    libxss1 \
    libpango-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY browser_server.py .
COPY .env .

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "browser_server.py"]
```

#### Dockerfile.document

```dockerfile
# docker/Dockerfile.document
FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY document_server.py .
COPY .env .

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "document_server.py"]
```

#### Dockerfile.client

```dockerfile
# docker/Dockerfile.client
FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY client_server.py .
COPY graph.py .
COPY .env .

# Create directory for reports
RUN mkdir -p reports

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "client_server.py"]
```

#### Dockerfile.streamlit

```dockerfile
# docker/Dockerfile.streamlit
FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY streamlit_app.py .
COPY .env .

# Expose port
EXPOSE 8501

# Run the application
CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

### 7. Now, let's create the docker-compose.yml file:

```yaml
# docker-compose.yml
version: '3'

services:
  browser-server:
    build:
      context: .
      dockerfile: docker/Dockerfile.browser
    ports:
      - "8000:8000"
    volumes:
      - ./browser_server.py:/app/browser_server.py
      - ./.env:/app/.env
    environment:
      - PYTHONUNBUFFERED=1

  document-server:
    build:
      context: .
      dockerfile: docker/Dockerfile.document
    ports:
      - "8001:8001"
    volumes:
      - ./document_server.py:/app/document_server.py
      - ./.env:/app/.env
    environment:
      - PYTHONUNBUFFERED=1

  client-server:
    build:
      context: .
      dockerfile: docker/Dockerfile.client
    ports:
      - "8080:8080"
    volumes:
      - ./client_server.py:/app/client_server.py
      - ./graph.py:/app/graph.py
      - ./.env:/app/.env
      - ./reports:/app/reports
    depends_on:
      - browser-server
      - document-server
    environment:
      - PYTHONUNBUFFERED=1

  streamlit-app:
    build:
      context: .
      dockerfile: docker/Dockerfile.streamlit
    ports:
      - "8501:8501"
    volumes:
      - ./streamlit_app.py:/app/streamlit_app.py
      - ./.env:/app/.env
    depends_on:
      - client-server
    environment:
      - PYTHONUNBUFFERED=1
```

### 8. Now, let's create the .env file:

```
# .env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

### 9. Now, let's create the run_app.sh script:

```bash
#!/bin/bash
# run_app.sh

# Start all services using docker-compose
docker-compose up --build
```

### 10. Now, let's create the kill_all.sh script:

```bash
#!/bin/bash
# kill_all.sh

# Stop all services
docker-compose down
```

### 11. Finally, let's create the README.md file:

```markdown
# Deep Research Report Generator

A comprehensive system for generating deep research reports based on web browsing and information gathering. This system uses MCP, LangGraph, FastAPI, and Streamlit to create a powerful research assistant.

## Features

- Web browsing and search using browser-use
- Multi-round conversation for task understanding
- Comprehensive report generation in Markdown format
- User-friendly interface for tracking research progress
- Downloadable research reports

## Architecture

The system consists of the following components:

1. **MCP Servers**:
   - **Browser Server**: Provides tools for web browsing and research
   - **Document Server**: Handles document processing and extraction

2. **LangGraph Agent**:
   - Orchestrates the research workflow
   - Manages multi-turn conversations
   - Generates the final report

3. **FastAPI Backend**:
   - Coordinates between the MCP servers and the frontend
   - Exposes endpoints for the Streamlit UI

4. **Streamlit UI**:
   - User-friendly interface for submitting research tasks
   - Displays research progress and final reports

## Installation

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/deep-research-report-generator.git
   cd deep-research-report-generator
   ```

2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o
   ```

3. Make the scripts executable:
   ```bash
   chmod +x run_app.sh kill_all.sh
   ```

## Usage

1. Start the application:
   ```bash
   ./run_app.sh
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8501
   ```

3. Enter a research topic and start the research process.

4. Track the progress of your research and view the final report.

5. To stop the application:
   ```bash
   ./kill_all.sh
   ```

## Development

### Project Structure

```
.
├── README.md
├── browser_server.py         # MCP server for web browsing
├── document_server.py        # MCP server for document processing
├── client_server.py          # FastAPI backend
├── graph.py                  # LangGraph workflow
├── streamlit_app.py          # Streamlit UI
├── docker/                   # Docker configuration
│   ├── Dockerfile.browser
│   ├── Dockerfile.document
│   ├── Dockerfile.client
│   └── Dockerfile.streamlit
├── docker-compose.yml        # Docker Compose configuration
├── .env                      # Environment variables
├── run_app.sh                # Script to start the application
└── kill_all.sh               # Script to stop the application
```

## License

MIT
```

## Conclusion

This Deep Research Report generation system provides a comprehensive solution for conducting research and generating detailed reports. The system leverages:

1. **browser-use** for web browsing and information gathering
2. **MCP** for tool integration and management
3. **LangGraph** for orchestrating the research workflow
4. **FastAPI** for backend services
5. **Streamlit** for a user-friendly interface

The system follows a modular architecture with separate components for web browsing, document processing, workflow orchestration, and user interface. This makes it easy to extend and maintain.

To run the system, simply execute the `run_app.sh` script, which will start all the necessary services using Docker Compose. The Streamlit UI will be available at http://localhost:8501, where you can submit research topics and track the progress of your research.

The final output is a comprehensive research report in Markdown format, which can be downloaded and shared. The report includes a table of contents, executive summary, detailed findings, and references.

This implementation provides a solid foundation for a Deep Research Report generation system that can be extended with additional features and capabilities as needed.
```