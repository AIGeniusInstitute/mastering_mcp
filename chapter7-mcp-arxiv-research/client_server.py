import os
from typing import Dict, Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel


class ResearchRequest(BaseModel):
    prompt: str

# Load environment variables from .env file
load_dotenv()

model = ChatOpenAI(
    model=os.environ['MODEL'],
    api_key=os.environ['API_KEY'],
    base_url=os.environ['BASE_URL'],
)

app = FastAPI(title="Research Assistant API")


#   client-server:
#     build:
#       context: .
#       dockerfile: docker/Dockerfile.client
#     ports:
#       - "8080:8080"
#     depends_on:
#       - arxiv-server
#       - docling-server
async def process_prompt(prompt: str) -> Dict[str, Any]:
    mcp_client = MultiServerMCPClient({
        "arxiv": {
            # "url": "http://arxiv-server:8000/sse",  # Use Docker service name
            "url": "http://localhost:8000/sse",  # localhost
            "transport": "sse",
        },
        "docling": {
            # "url": "http://docling-server:8001/sse",  # Use Docker service name
            "url": "http://localhost:8001/sse",  # localhost
            "transport": "sse",
        }
    })
    tools = await mcp_client.get_tools()
    agent = create_react_agent(model, tools)
    response = await agent.ainvoke({"messages": prompt}, debug=False)
    messages = [{i.type: i.content} for i in response['messages'] if i.content != '']
    return {"messages": messages}


@app.post("/research")
async def research(request: ResearchRequest):
    """Process a research query using arxiv and document analysis tools"""
    return await process_prompt(request.prompt)


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8080)
