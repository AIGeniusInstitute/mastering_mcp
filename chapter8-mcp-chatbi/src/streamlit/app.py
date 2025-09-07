import json
import logging
import os

import pandas as pd
import plotly.express as px
import requests
import streamlit as st

# API URL from environment variable or default
API_URL = os.getenv("API_URL", "http://localhost:8000")

st.set_page_config(layout="wide", page_title="ChatBI")

st.title("ChatBI: 智能数据分析与洞察")
st.caption("与您的数据进行对话，获取智能洞察和可视化图表。")

logger = logging.getLogger(__name__)

# Initialize session state variables
if "conversation_id" not in st.session_state:
    st.session_state.conversation_id = None
if "messages" not in st.session_state:
    st.session_state.messages = []  # Store full message objects for display
if "visualizations" not in st.session_state:
    st.session_state.visualizations = []
if "conversation_list" not in st.session_state:
    st.session_state.conversation_list = []


# --- Helper Functions ---
def fetch_conversations():
    try:
        response = requests.get(f"{API_URL}/api/chat/conversations")
        response.raise_for_status()
        st.session_state.conversation_list = response.json()
    except requests.exceptions.RequestException as e:
        st.sidebar.error(f"加载会话列表失败: {e}")
        st.session_state.conversation_list = []


def create_new_conversation():
    try:
        # Simple title for new conversation, API will update it later
        response = requests.post(f"{API_URL}/api/chat/conversations", json={"title": "新的对话"})
        response.raise_for_status()
        new_conv = response.json()
        st.session_state.conversation_id = new_conv["id"]
        st.session_state.messages = []
        st.session_state.visualizations = []
        fetch_conversations()  # Refresh list
        st.rerun()
    except requests.exceptions.RequestException as e:
        st.error(f"创建新会话失败: {e}")


def load_conversation(conversation_id):
    try:
        response = requests.get(f"{API_URL}/api/chat/conversations/{conversation_id}")
        response.raise_for_status()
        conv_data = response.json()
        st.session_state.conversation_id = conv_data["id"]
        st.session_state.messages = conv_data.get("messages", [])

        # Load visualizations for this conversation
        viz_response = requests.get(f"{API_URL}/api/chat/conversations/{conversation_id}/visualizations")
        viz_response.raise_for_status()
        st.session_state.visualizations = viz_response.json()

        st.rerun()
    except requests.exceptions.RequestException as e:
        st.error(f"加载会话失败: {e}")


# --- Sidebar for Conversations ---
with st.sidebar:
    st.header("会话历史")
    if st.button("➕ 新建对话", use_container_width=True):
        create_new_conversation()

    fetch_conversations()  # Fetch on each sidebar render if needed, or less frequently

    if st.session_state.conversation_list:
        for conv in st.session_state.conversation_list:
            if st.button(f"{conv['title']} (ID: {conv['id']})", key=f"conv_{conv['id']}", use_container_width=True):
                load_conversation(conv['id'])
    else:
        st.write("暂无历史会话。")

    st.markdown("---")
    st.info("ChatBI,一个基于LangGraph, FastAPI, Streamlit 和 MCP 的 ChatBI 系统。")

# --- Main Chat Interface ---
if st.session_state.conversation_id:
    st.header(f"当前对话 (ID: {st.session_state.conversation_id})")

    # Display chat messages
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Display visualizations
    if st.session_state.visualizations:
        st.subheader("📊 可视化图表")
        for viz in st.session_state.visualizations:

            logger.info(f"Rendering visualization: {viz}")

            # Ensure 'title' and 'chart_type' exist, provide defaults if not
            viz_title = viz.get('title', '未命名图表')
            viz_chart_type = viz.get('chart_type', 'unknown').lower()

            with st.expander(f"{viz_title} ({viz_chart_type})", expanded=True):
                try:
                    chart_data_payload = viz["chart_data"] # This is the main data payload for the chart
                    if isinstance(chart_data_payload, str):  # Handle if chart_data is a JSON string
                        chart_data_payload = json.loads(chart_data_payload)

                    if not isinstance(chart_data_payload, dict) or "data" not in chart_data_payload:
                        st.warning(f"图表 '{viz_title}' 的数据格式不正确或缺少 'data' 键。")
                        st.json(chart_data_payload)
                        continue
                    
                    # Extracting data from the payload
                    plotly_data_list = chart_data_payload.get("data")

                    if not plotly_data_list or not isinstance(plotly_data_list, list) or not plotly_data_list[0]:
                        st.warning(f"图表 '{viz_title}' 的 'data' 列表为空或格式不正确。")
                        st.json(chart_data_payload)
                        continue
                    
                    # Assuming single trace for bar, line, pie for now
                    trace = plotly_data_list[0] 

                    if viz_chart_type == "bar":
                        x_values = trace.get("x")
                        y_values = trace.get("y")
                        series_name = trace.get("name", "数值")
                        if x_values is None or y_values is None:
                            st.error(f"条形图 '{viz_title}' 缺少 x 或 y 数据。")
                            st.json(trace)
                            continue
                        df = pd.DataFrame({series_name: y_values}, index=x_values)
                        st.bar_chart(df)
                    elif viz_chart_type == "line":
                        x_values = trace.get("x")
                        y_values = trace.get("y")
                        series_name = trace.get("name", "数值")
                        if x_values is None or y_values is None:
                            st.error(f"折线图 '{viz_title}' 缺少 x 或 y 数据。")
                            st.json(trace)
                            continue
                        df = pd.DataFrame({series_name: y_values}, index=x_values)
                        st.line_chart(df)
                    elif viz_chart_type == "pie":
                        labels = trace.get("labels")
                        values = trace.get("values")
                        if labels is None or values is None:
                            st.error(f"饼图 '{viz_title}' 缺少 labels 或 values 数据。")
                            st.json(trace)
                            continue
                        fig = px.pie(names=labels, values=values, title=viz_title)
                        st.plotly_chart(fig, use_container_width=True)
                    elif viz_chart_type == "table":
                        # Table data structure is different, directly from chart_data_payload
                        table_data = chart_data_payload.get("data")
                        table_columns = chart_data_payload.get("columns")
                        if table_data is None or table_columns is None:
                            st.error(f"表格 '{viz_title}' 缺少 data 或 columns。")
                            st.json(chart_data_payload)
                            continue
                        df = pd.DataFrame(table_data, columns=table_columns)
                        st.dataframe(df)
                    else:
                        st.warning(f"不支持的图表类型: {viz_chart_type}")
                        st.json(chart_data_payload)
                except Exception as e:
                    st.error(f"渲染图表 '{viz_title}' 失败: {e}")
                    st.json(viz.get("chart_data", "无图表数据"))

    # Chat input
    if prompt := st.chat_input("请输入您的问题或指令..."):
        # Add user message to UI
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # Send message to API and get response
        try:
            with st.spinner("AI思考中..."):
                response = requests.post(
                    f"{API_URL}/api/chat/conversations/{st.session_state.conversation_id}/messages",
                    json={"content": prompt, "role": "user"}
                )
                response.raise_for_status()
                ai_response = response.json()

            # Add AI response to UI
            st.session_state.messages.append({"role": "assistant", "content": ai_response["content"]})

            # Fetch updated visualizations
            viz_response = requests.get(
                f"{API_URL}/api/chat/conversations/{st.session_state.conversation_id}/visualizations")
            viz_response.raise_for_status()
            st.session_state.visualizations = viz_response.json()

            st.rerun()  # Rerun to display new messages and visualizations

        except requests.exceptions.RequestException as e:
            st.error(f"与API通信失败: {e}")
            # Remove the optimistic user message if API call failed
            # st.session_state.messages.pop() # Or handle error display differently
        except Exception as e:
            st.error(f"处理消息时发生错误: {e}")

else:
    st.info("请从侧边栏选择一个会话或创建一个新会话开始。")
