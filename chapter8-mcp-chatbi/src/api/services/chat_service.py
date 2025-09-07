import json
import logging
import os
from typing import List, Dict, Tuple, Any

from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


async def process_chat_message(
        message_history: List[Dict[str, str]],
        db: Session  # db parameter is not used in the provided snippet, consider if it's needed
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Process a chat message using the LangGraph agent.
    
    Args:
        message_history: List of message dictionaries with 'role' and 'content'
        db: Database session (currently unused in this snippet)
        
    Returns:
        Tuple containing the response text and a list of visualizations
    """
    # Initialize the model
    model = ChatOpenAI(
        model=os.environ.get("MODEL", "gpt-4-turbo"),
        api_key=os.environ.get("API_KEY"),
        base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1"),
    )

    # Connect to MCP servers
    mcp_client = MultiServerMCPClient({
        "database": {
            "url": "http://localhost:8002/sse",  # Database MCP server
            "transport": "sse",
        },
        "visualization": {
            "url": "http://localhost:8003/sse",  # Visualization MCP server
            "transport": "sse",
        }
    })

    # Get tools from MCP servers
    tools = await mcp_client.get_tools()  # Use aget_tools for async

    logger.info(f"Available tools: {tools}")

    # Create the ReAct agent
    agent_executor = create_react_agent(model, tools)

    response_text = ""
    visualizations = []

    try:
        agent_input = {"messages": message_history}

        visualization_tool_names = [
            "create_bar_chart",
            "create_line_chart",
            "create_pie_chart",
            "create_scatter_plot",
            "create_heatmap",
            "create_dashboard"
        ]

        async for event in agent_executor.astream_events(agent_input, version="v1"):
            logger.info(f"Received event: {event}")

            kind = event["event"]
            if kind == "on_tool_end":
                tool_name = event["name"]
                tool_output = event["data"].get("output")
                print(f"Tool End: {tool_name} with output {tool_output}")
                if tool_name in visualization_tool_names and tool_output:
                    try:
                        # Handle both ToolMessage and direct string output
                        tool_output_str = tool_output.content if hasattr(tool_output, 'content') else str(tool_output)

                        # Assuming the tool output is a JSON string for the visualization
                        viz_data = json.loads(tool_output_str)
                        # Ensure it's a valid chart/dashboard configuration
                        if isinstance(viz_data, dict) and (viz_data.get("chart_type") or viz_data.get("dashboard_title")):
                            visualizations.append(viz_data)
                        elif isinstance(viz_data, dict) and viz_data.get("error"):
                            print(f"Visualization tool {tool_name} returned an error: {viz_data.get('error')}")
                        # If create_dashboard returns a list of charts
                        elif isinstance(viz_data, list):
                            visualizations.extend(
                                chart for chart in viz_data if isinstance(chart, dict) and chart.get("chart_type"))

                    except json.JSONDecodeError:
                        print(f"Warning: Could not parse visualization data from tool {tool_name}: {tool_output}")
                    except Exception as e:
                        print(f"Error processing tool output for {tool_name}: {e}")

            elif kind == "on_agent_action":
                # Optional: Log agent actions if needed
                # print(f"Agent Action: {event['data'].get('action')}")
                pass
            elif kind == "on_agent_finish":  # LangGraph ReAct agent might use on_agent_finish for final output
                agent_output = event["data"].get("output", {})
                if isinstance(agent_output, dict) and "messages" in agent_output:
                    final_message_obj = agent_output["messages"][-1]
                    if hasattr(final_message_obj, 'content'):
                        response_text = final_message_obj.content
                    elif isinstance(final_message_obj, dict) and "content" in final_message_obj:
                        response_text = final_message_obj["content"]
                elif isinstance(agent_output, str):  # Fallback if output is just a string
                    response_text = agent_output

        # Fallback if response_text wasn't captured clearly from events
        if not response_text:

            # execute the agent with the provided input
            full_output = await agent_executor.ainvoke(agent_input, {"recursion_limit": 100})

            if "output" in full_output:
                response_text = full_output["output"]
            elif "messages" in full_output and full_output["messages"]:
                final_message_obj = full_output["messages"][-1]
                if hasattr(final_message_obj, 'content'):
                    response_text = final_message_obj.content
                elif isinstance(final_message_obj, str):
                    response_text = final_message_obj

            if not response_text:
                response_text = "I've processed your request. See visualizations below if any were generated."


    except Exception as e:
        print(f"Error processing message with LangGraph agent: {e}")
        response_text = "Sorry, I encountered an error while processing your request."
        visualizations = []  # Clear visualizations on error

    return response_text, visualizations


# Example of how you might structure a more complete agent invocation
# This is conceptual and would need to be adapted based on LangGraph's specific event stream.
async def _execute_agent_with_tool_handling(agent_executor, agent_input):
    visualizations = []
    final_response = ""

    # Stream events from the agent
    async for event in agent_executor.astream_events(agent_input, version="v1"):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            # Handle content from the language model
            content = event["data"]["chunk"]
            if content:
                # This might be part of the final answer or reasoning
                # For simplicity, we'll assume the final answer comes at the end.
                pass

        elif kind == "on_tool_start":
            # A tool is about to be called
            print(f"Tool Start: {event['name']} with input {event['data'].get('input')}")

        elif kind == "on_tool_end":
            # A tool has finished execution
            print(f"Tool End: {event['name']} with output {event['data'].get('output')}")
            # Here you would parse the tool output. If it's a visualization, add it.
            # This requires tools to return structured data.
            tool_output = event["data"].get("output")
            if event["name"] == "visualization_tool_name_placeholder":  # Replace with actual tool name
                try:
                    # Assuming the tool output is a JSON string for the visualization
                    viz_data = json.loads(tool_output)
                    if "title" in viz_data and "chart_type" in viz_data and "chart_data" in viz_data:
                        visualizations.append(viz_data)
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse visualization data from tool {event['name']}")

        elif kind == "on_chain_end":  # Or a similar event indicating the end of the main agent run
            # This might signify the end of the agent's thought process
            # The final answer might be in event['data']['output'] or similar
            # For create_react_agent, the final answer is often in the 'messages' list of the output state.
            if "messages" in event["data"].get("output", {}):
                final_message = event["data"]["output"]["messages"][-1]
                if hasattr(final_message, 'content'):
                    final_response = final_message.content
                elif isinstance(final_message, dict) and "content" in final_message:
                    final_response = final_message["content"]

    # If final_response wasn't captured clearly from events,
    # a final invoke might be needed, or the structure of ReAct output needs specific parsing.
    if not final_response:
        # Fallback or alternative way to get the final response
        full_output = await agent_executor.ainvoke(agent_input)
        # The structure of full_output depends on the agent.
        # For create_react_agent, it's often a dict with 'messages' or 'output'.
        if "output" in full_output:  # Common for some LangChain constructs
            final_response = full_output["output"]
        elif "messages" in full_output and full_output["messages"]:  # For agent executors
            # The last message is usually the AI's final response
            final_message_obj = full_output["messages"][-1]
            if hasattr(final_message_obj, 'content'):
                final_response = final_message_obj.content
            elif isinstance(final_message_obj, str):  # Sometimes it's just a string
                final_response = final_message_obj

    return final_response if final_response else "Could not determine final agent response.", visualizations
