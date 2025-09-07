# streamlit_app.py
import datetime
import os

import requests
import streamlit as st
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API endpoint
API_URL = os.environ.get("API_URL", "http://localhost:8080")


def query_research_api(topic, depth="medium", format="markdown"):
    """Query the research API with the given parameters and stream the response"""
    try:
        response = requests.post(
            f"{API_URL}/research",
            headers={"accept": "application/json", "Content-Type": "application/json"},
            json={"topic": topic, "depth": depth, "format": format},
            stream=True  # Enable streaming
        )
        response.raise_for_status() # Raise an exception for bad status codes
        # For streaming, we will process the response line by line or chunk by chunk
        # The actual processing will happen where this function is called.
        return response
    except requests.exceptions.RequestException as e:
        st.error(f"Error connecting to API: {e}")
        return None
    except Exception as e:
        st.error(f"An unexpected error occurred: {e}")
        print(e)
        return None


def save_report(report, filename):
    """Save the report to a file"""
    with open(filename, "w", encoding="utf-8") as f:
        f.write(report)
    return filename


def main():
    # Set up the page
    st.set_page_config(
        page_title="Deep Research Report Generator",
        page_icon="📚",
        layout="wide"
    )

    st.title("📚 Deep Research Report Generator")
    st.subheader("Generate comprehensive research reports on any topic")

    # Initialize session state
    if "reports" not in st.session_state:
        st.session_state.reports = {}

    if "current_report_id" not in st.session_state:
        st.session_state.current_report_id = None

    if "next_report_id" not in st.session_state:
        st.session_state.next_report_id = 1

    # Sidebar for navigation and settings
    with st.sidebar:
        st.header("Navigation")

        # New report button
        if st.button("New Report", key="new_report_btn"):
            new_id = st.session_state.next_report_id
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            st.session_state.reports[new_id] = {
                "title": f"Report {new_id} ({timestamp})",
                "content": "",
                "sources": [],
                "timestamp": timestamp
            }
            st.session_state.current_report_id = new_id
            st.session_state.next_report_id += 1
            st.rerun()

        # Display list of reports
        st.write("### Your Reports")
        report_options = {
            str(report_id): report_data["title"]
            for report_id, report_data in st.session_state.reports.items()
        }

        if report_options:
            selected_report = str(st.session_state.current_report_id or list(report_options.keys())[0])
            selected_report = st.radio(
                "Select a report:",
                options=list(report_options.keys()),
                format_func=lambda x: report_options[x],
                label_visibility="collapsed",
                index=list(report_options.keys()).index(selected_report) if selected_report in report_options else 0
            )

            if int(selected_report) != st.session_state.current_report_id:
                st.session_state.current_report_id = int(selected_report)
                st.rerun()

        # Settings
        st.header("Settings")
        research_depth = st.select_slider(
            "Research Depth",
            options=["shallow", "medium", "deep"],
            value="medium",
            help="Controls how detailed the research will be"
        )

        output_format = st.radio(
            "Output Format",
            options=["markdown", "text"],
            index=0,
            help="Format of the generated report"
        )

    # Main content area
    if not st.session_state.reports:
        # No reports yet, show welcome message
        st.info("Welcome! Click 'New Report' in the sidebar to get started.")
    else:
        # Show the current report
        current_report = st.session_state.reports[st.session_state.current_report_id]

        # Input form
        with st.form("research_form"):
            topic = st.text_input("Research Topic", placeholder="Enter a topic to research...")
            col1, col2 = st.columns([3, 1])
            with col1:
                submit_button = st.form_submit_button("Generate Report")
            with col2:
                clear_button = st.form_submit_button("Clear")

        if submit_button and topic:
            report_placeholder = st.empty() # Placeholder for streaming the report
            current_report_content = ""
            current_report_sources = []
            
            with st.spinner("Researching and generating report... This may take a few minutes."):
                response_stream = query_research_api(topic, research_depth, output_format)

                if response_stream:
                    try:
                        # Iterate over the stream line by line
                        # The server sends text chunks for the report, and a final JSON string for sources
                        buffer = ""
                        for line_bytes in response_stream.iter_lines():
                            line = line_bytes.decode('utf-8')
                            # Try to parse as JSON. If it's the sources dict, it will parse.
                            try:
                                # Check if the line is the JSON object for sources
                                # A simple heuristic: does it look like a JSON object?
                                if line.strip().startswith('{') and line.strip().endswith('}'):
                                    sources_data = json.loads(line)
                                    if isinstance(sources_data, dict) and 'sources' in sources_data:
                                        current_report_sources = sources_data.get("sources", [])
                                        # Once sources are received, we assume the report text stream is complete
                                        break # Exit the loop after processing sources
                                    else:
                                        # Not the sources JSON, append to report content
                                        current_report_content += line + "\n"
                                else:
                                    current_report_content += line + "\n"
                            except json.JSONDecodeError:
                                # Not a JSON line, so it's part of the report content
                                current_report_content += line + "\n"
                            
                            report_placeholder.markdown(current_report_content) # Update placeholder with new content
                        
                        # Ensure the final content is displayed if loop finished before sources were found
                        # or if sources were the very last thing.
                        report_placeholder.markdown(current_report_content)

                        if not current_report_content and not current_report_sources:
                            st.error("Received empty response from server.")
                            current_report_content = "Error: Empty response."
                            report_placeholder.markdown(current_report_content)

                    except requests.exceptions.RequestException as e:
                        st.error(f"Error during streaming: {e}")
                        current_report_content = f"Error: Could not stream report. {e}"
                        report_placeholder.markdown(current_report_content)
                    except Exception as e:
                        st.error(f"Error processing streamed response: {e}")
                        current_report_content = f"Error: {e}"
                        report_placeholder.markdown(current_report_content)

                    # Update the current report in session state
                    current_report["content"] = current_report_content
                    current_report["sources"] = current_report_sources
                    current_report["title"] = f"Report on: {topic}"
                    current_report["timestamp"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                    st.session_state.reports[st.session_state.current_report_id] = current_report
                    st.rerun() # Rerun to update the display properly after spinner
                else:
                    st.error("Failed to connect to the research API.")
                    current_report["content"] = "Error: Could not connect to API."
                    report_placeholder.markdown(current_report["content"])

        if clear_button:
            current_report["content"] = ""
            current_report["sources"] = []
            st.session_state.reports[st.session_state.current_report_id] = current_report

        # Display the report
        if current_report["content"]:
            st.header(current_report["title"])
            st.write(f"*Generated on: {current_report['timestamp']}*")

            # Display tabs for report and sources
            tab1, tab2 = st.tabs(["Report", "Sources"])

            with tab1:
                st.markdown(current_report["content"])

                # Download button
                report_filename = f"report_{st.session_state.current_report_id}_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.md"
                st.download_button(
                    label="Download Report",
                    data=current_report["content"],
                    file_name=report_filename,
                    mime="text/markdown"
                )

            with tab2:
                if current_report["sources"]:
                    for i, source in enumerate(current_report["sources"], 1):
                        st.write(f"{i}. [{source.get('url', 'Unknown source')}]({source.get('url', '#')})")
                else:
                    st.info("No sources found for this report.")
        else:
            st.info("Enter a research topic and click 'Generate Report' to create a new report.")

    # Footer
    st.caption("Deep Research Report Generator powered by browser-use, LangGraph, and MCP")


if __name__ == "__main__":
    main()
