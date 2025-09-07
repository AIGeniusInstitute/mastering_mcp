# client_server.py
import os
from datetime import datetime
from typing import Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

from graph import make_graph

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Deep Research Report API")

# Initialize LLM
model = ChatOpenAI(
    model=os.environ['DeepSeek_R1_0528'],
    api_key=os.environ['OPENAI_API_KEY'],
    base_url=os.environ['OPENAI_BASE_URL'],
)

current_date = datetime.now().strftime('%Y-%m-%d')

# Initialize LangGraph
research_graph = make_graph()


class ResearchRequest(BaseModel):
    topic: str
    depth: Optional[str] = "shallow"  # "shallow", "medium", "deep"
    format: Optional[str] = "markdown"  # "markdown", "text"


class ResearchResponse(BaseModel):
    report: str
    sources: List[Dict[str, str]]


from fastapi.responses import StreamingResponse
import json # Add this import for json.dumps

@app.post("/research") # Removed response_model for StreamingResponse
async def research(request: ResearchRequest):
    """
    Process a research request and generate a comprehensive report, streaming the output.
    """
    async def stream_report_content():
        try:
            # Connect to MCP servers
            mcp_client = MultiServerMCPClient({
                "research": {
                    "url": os.environ.get("BROWSER_SERVER_URL", "http://localhost:8000/sse"),
                    "transport": "sse",
                }
            })

            # Get tools from MCP servers
            tools = await mcp_client.get_tools()
            print(tools)

            # Create a ReAct agent with the tools
            agent = create_react_agent(model, tools)

            # Prepare the prompt based on the research request
            depth_instructions = {
                "shallow": "Conduct a brief overview of the topic, focusing on key points.",
                "medium": "Conduct a comprehensive analysis of the topic, including key aspects and some details.",
                "deep": "Conduct an in-depth analysis of the topic, exploring all relevant aspects in detail."
            }

            research_prompt_text = f"""
            Current Date: {current_date}
            ----------------------------
            I need you to research the following topic: {request.topic}
            
            {depth_instructions.get(request.depth, depth_instructions["medium"])}
            
            Please follow these steps:
            1. According to the user query, choose the best tool to Search the web data for relevant information, tools to choose: `web_search`(for search general information), `search_arxiv`(for search in arxiv papers), `search_by_api`(for search in specific api)
            2. Browse specific URLs for more detailed information using the `LinkReader` tool
            3. After gathering all necessary information, synthesize it into a comprehensive research report.
            4. Translate the report using the `Translator` tool if requested (this part can be enhanced later).
            
            The final report should be in {request.format} format and include:
            - A clear title and summary
            - Well-structured sections covering all aspects of the topic
            - Proper citations and references (extract these from the gathered information)
            - Actionable insights and recommendations
            
            You MUST now gather the information using the available tools. Once you have sufficient information, use the information to generate the final report.
            """
            print(f"research prompt:{research_prompt_text}")

            # Invoke the agent to gather information
            agent_response_data = await agent.ainvoke({"messages": research_prompt_text}, {"recursion_limit": 10})
            print(f"Agent response for information gathering: {agent_response_data}")

            # Extract gathered information
            gathered_information_text = "\n".join([msg.content for msg in agent_response_data.get('messages', []) if hasattr(msg, 'content') and msg.content and msg.type == 'tool'])
            if not gathered_information_text:
                gathered_information_text = "No information was gathered by the agent."
            print(f"Gathered information: {gathered_information_text}")

            # Prepare report generation prompt
            report_generation_prompt_text = f"""
            Based on the following research information:
            --- START OF RESEARCH INFORMATION ---
            {gathered_information_text}
            --- END OF RESEARCH INFORMATION ---

            And the original research request:
            Topic: {request.topic}
            Depth: {request.depth}
            Format: {request.format}

            Please generate a comprehensive research report. The report should be in {request.format} format and include:
            - A clear title and summary
            - Well-structured sections covering all aspects of the topic
            - Proper citations and references (ensure these are based on the research information)
            - Actionable insights and recommendations

            The output should be ONLY the report content in the specified format.
            """
            print(f"Report generation prompt: {report_generation_prompt_text}")

            full_report_content = ""
            # Stream the report generation from LLM
            async for chunk in model.astream(report_generation_prompt_text):
                if hasattr(chunk, 'content') and chunk.content:
                    content_piece = chunk.content
                    full_report_content += content_piece
                    yield content_piece # Stream each piece of content
            
            # After streaming all report content, extract sources and send them as a final JSON chunk
            # This is a common pattern: stream text, then send a structured JSON object at the end.
            sources_list = []
            import re
            urls_found = re.findall(r'https?://[^\s]+', gathered_information_text + full_report_content)
            for url_item in urls_found:
                if url_item not in [src_item['url'] for src_item in sources_list]:
                    sources_list.append({"url": url_item})

            # Send a special marker or structure for sources
            # Option 1: Send as a JSON string prefixed by a known marker
            # yield f"\n\n__SOURCES_JSON_START__\n{json.dumps({'sources': sources_list})}\n__SOURCES_JSON_END__\n"
            # Option 2: If client expects newline-delimited JSON, send sources as one such line.
            # This requires client to know how to distinguish report text from this final JSON.
            # For simplicity with streamlit, we might need to adjust how streamlit consumes this.
            # The previous streamlit_app.py was expecting a single JSON at the end.
            # To make it work with current streamlit_app.py (which expects one final JSON for everything after stream=True)
            # we might need to reconsider.
            # However, the request is to make client_server.py use StreamingResponse.
            # Let's assume the client (streamlit_app.py) will be adapted to handle text stream + final JSON for sources.

            # For now, let's send sources as a separate JSON payload. Client needs to handle this.
            # A common way is to send data events if using SSE, or just a specially formatted final chunk.
            # We will yield a JSON string that the client can parse. It's up to the client to detect this.
            # A simple way: client reads until it gets a parsable JSON. This is fragile.
            # Better: client reads text, and then expects a final, separate JSON payload for metadata like sources.
            # The current streamlit_app.py is NOT set up for this. It expects one .json() call on the response.
            # To make this truly stream and then provide sources, streamlit_app.py needs significant changes.

            # Let's send sources as a JSON string. The client will need to parse this separately.
            # This is a common pattern for streaming text and then metadata.

            final_metadata = {"report_complete": True, "sources": sources_list}
            yield f"\nENDOFTEXTSTREAM\n{json.dumps(final_metadata)}"

        except Exception as e:
            print(f"Error during streaming: {e}")
            # Yield an error message if something goes wrong during the stream
            error_message = json.dumps({"error": str(e), "sources": []})
            yield error_message
            # No raise HTTPException here as we are in a generator

    return StreamingResponse(stream_report_content(), media_type="text/plain") # text/event-stream for SSE


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
