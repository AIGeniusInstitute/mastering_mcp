# src/agents/graph.py
import logging
import os
from typing import Dict, List, Any, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


# Define the state
class MessagesState(TypedDict):
    messages: List[BaseMessage]
    tools: List[BaseTool]


def make_graph(tools: List[BaseTool]):
    """
    Create a LangGraph for the ChatBI agent.

    Args:
        tools: List of tools available to the agent

    Returns:
        A StateGraph for the ChatBI agent
    """
    # Initialize the model
    model = ChatOpenAI(
        model=os.environ.get("MODEL", "gpt-4-turbo"),
        api_key=os.environ.get("API_KEY"),
        base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1"),
        temperature=0
    )

    # Define the nodes

    # Agent node - decides what to do
    def agent(state: MessagesState) -> Dict[str, Any]:
        """Agent node that decides what to do next."""
        messages = state["messages"]
        tools = state["tools"]

        # Get the current date
        import time
        current_date = time.strftime("%Y-%m-%d")

        # System message with instructions
        system_message = f"""You are ChatBI, an advanced business intelligence assistant that helps users analyze data and create visualizations.

        You can:
        1. Query MySQL databases using SQL
        2. Create visualizations based on data
        3. Provide insights and analysis

        When users ask questions about data, follow these steps:
        1. Understand what data they need
        2. Formulate appropriate SQL queries
        3. Execute the queries using the database tools
        4. Analyze the results
        5. Create visualizations when appropriate
        6. Explain insights in clear, business-friendly language

        Always show your SQL queries to the user and explain your reasoning.
        When creating visualizations, choose the most appropriate chart type for the data and analysis.
        
        ----
        CURRENT DATE: {current_date}
        """

        # Add system message if it's the first interaction
        if len(messages) == 1 and isinstance(messages[0], HumanMessage):
            messages = [
                HumanMessage(content=system_message),
                *messages
            ]

        logger.info(f"Messages: {messages}")

        # Call the model
        response = model.bind(tools=tools).invoke(messages, {"recursion_limit": 100})

        logger.info(f"Response: {response}")

        # Check if the model wants to use a tool
        if response.tool_calls:
            # Return the tool calls
            return {"messages": messages + [response], "tools": tools, "next": "tool"}
        else:
            # Return the final response
            return {"messages": messages + [response], "tools": tools, "next": END}

    # Tool node - executes tools
    tool_node = ToolNode(tools)

    # Define the graph
    workflow = StateGraph(MessagesState)

    # Add nodes
    workflow.add_node("agent", agent)
    workflow.add_node("tool", tool_node)

    # Define edges
    workflow.add_edge("agent", "tool")
    workflow.add_edge("tool", "agent")

    # Set the entry point
    workflow.set_entry_point("agent")

    return workflow.compile()
