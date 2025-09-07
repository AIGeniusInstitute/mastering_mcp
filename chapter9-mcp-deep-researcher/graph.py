# graph.py
import os
from datetime import datetime
from typing import Dict, List, Any, TypedDict

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
from langchain_core.messages import HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

# Load environment variables
load_dotenv()

# Initialize the LLM
model = ChatOpenAI(
    model=os.environ['DeepSeek_R1_0528'],
    api_key=os.environ['OPENAI_API_KEY'],
    base_url=os.environ['OPENAI_BASE_URL'],
)

current_date = datetime.now().strftime('%Y-%m-%d')

# Define the state
class AgentState(TypedDict):
    messages: List[BaseMessage]
    research_data: List[Dict[str, Any]]
    report: str


def make_graph():
    # Define the nodes
    def understand_task(state: AgentState) -> AgentState:
        """Understand the research task and plan the research approach."""
        messages = state["messages"]

        # Get the last user message
        last_message = messages[-1].content if messages else ""

        # Create a prompt for understanding the task
        prompt = f"""
        Current Date: {current_date}
        ----------------------------
        I need to understand the research task and plan my approach. The user has requested:
        
        {last_message}
        
        I should:
        1. Identify the main research topic
        2. Determine key questions to answer
        3. Plan what information sources to use
        4. Outline the structure of the final report
        
        Let me analyze this request and create a research plan.
        """

        print(f"understand_task:{prompt}")

        # Get response from the LLM
        response = model.invoke([HumanMessage(content=prompt)])

        # Update the state
        state["messages"].append(AIMessage(content=response.content))
        state["research_data"] = []

        return state

    def collect_data(state: AgentState) -> AgentState:
        """Collect data based on the research plan."""
        messages = state["messages"]

        # Get the research plan from the previous step
        research_plan = messages[-1].content if messages else ""

        # Create a prompt for collecting data
        prompt = f"""
        Current Date: {current_date}
        ----------------------------
        Based on my research plan:
        
        {research_plan}
        
        I need to collect relevant data. I should:
        1. Identify key search queries, use `LinkReader` tool to read the content
        2. Determine what specific information to extract
        3. Plan how to organize the collected data
        
        Let me outline my data collection strategy.
        """

        print(f"collect_data:{prompt}")
        # Get response from the LLM
        response = model.invoke([HumanMessage(content=prompt)])

        # Update the state
        state["messages"].append(AIMessage(content=response.content))

        # Simulate collecting data (in a real implementation, this would use the browser_server tools)
        state["research_data"].append({
            "source": "Simulated data collection",
            "content": "This is where the actual data collection would happen using the browser_server tools."
        })

        return state

    def analyze_data(state: AgentState) -> AgentState:
        """Analyze the collected data."""
        messages = state["messages"]
        research_data = state["research_data"]

        # Create a prompt for analyzing data
        prompt = f"""
        Current Date: {current_date}
        ----------------------------
        I have collected the following research data:
        
        {research_data}
        
        I need to analyze this data to extract key insights. I should:
        1. Identify patterns and trends
        2. Extract key facts and figures
        3. Evaluate the reliability of sources
        4. Synthesize the information
        
        Let me analyze this data and prepare for report generation.
        """
        print(f"analyze_data:{prompt}")
        # Get response from the LLM
        response = model.invoke([HumanMessage(content=prompt)])

        # Update the state
        state["messages"].append(AIMessage(content=response.content))

        return state

    def generate_report(state: AgentState) -> AgentState:
        """Generate the final research report."""
        messages = state["messages"]

        # Get the analysis from the previous step
        analysis = messages[-1].content if messages else ""

        # Create a prompt for generating the report
        prompt = f"""
        Current Date: {current_date}
        ----------------------------
        Based on my analysis:
        
        {analysis}
        
        I need to generate a comprehensive research report. The report should:
        1. Have a clear structure with sections
        2. Present findings in a logical order
        3. Include supporting evidence
        4. Provide actionable recommendations
        
        Let me create this report in markdown format.
        """

        print(f"generate_report:{prompt}")

        # Get response from the LLM
        response = model.invoke([HumanMessage(content=prompt)])

        # Update the state
        state["messages"].append(AIMessage(content=response.content))
        state["report"] = response.content

        return state
    def translate_report(state: AgentState) -> AgentState:
        """Generate the final research report."""
        messages = state["messages"]

        # Get the analysis from the previous step
        analysis = messages[-1].content if messages else ""

        # Create a prompt for generating the report
        prompt = f"""
        Current Date: {current_date}
        ----------------------------
        Based on my analysis:
        
        {analysis}
        
        I need to translate the research report.
        """

        print(f"translate_report:{prompt}")

        # Get response from the LLM
        response = model.invoke([HumanMessage(content=prompt)])

        # Update the state
        state["messages"].append(AIMessage(content=response.content))
        state["report"] = response.content

        return state

    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("understand_task", understand_task)
    workflow.add_node("collect_data", collect_data)
    workflow.add_node("analyze_data", analyze_data)
    workflow.add_node("generate_report", generate_report)
    workflow.add_node("translate_report", translate_report)

    # Add edges
    workflow.add_edge("understand_task", "collect_data")
    workflow.add_edge("collect_data", "analyze_data")
    workflow.add_edge("analyze_data", "generate_report")
    workflow.add_edge("generate_report", "translate_report")
    workflow.add_edge("translate_report", END)

    # Set the entry point
    workflow.set_entry_point("understand_task")

    return workflow.compile()
