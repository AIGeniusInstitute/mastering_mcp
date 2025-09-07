# src/mcp_servers/visualization_server.py
import asyncio
import json
import logging
import os

import mysql.connector
import pandas as pd
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Visualization Provider", port=8003)

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "88888888")
DB_NAME = os.getenv("DB_NAME", "chatbi")
DB_PORT = os.getenv("DB_PORT", "3306")


def get_db_connection():
    """Create a connection to the MySQL database."""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None


def execute_query(query: str):
    """Execute a SQL query and return the results as a pandas DataFrame."""
    connection = get_db_connection()
    if not connection:
        return None

    try:
        return pd.read_sql(query, connection)
    except mysql.connector.Error as err:
        print(f"Error executing query: {err}")
        return None
    finally:
        if connection.is_connected():
            connection.close()


@mcp.tool(
    name="create_bar_chart",
    description="Create a bar chart visualization from SQL query results"
)
async def create_bar_chart(
        query: str,
        x_column: str,
        y_column: str,
        title: str = "Bar Chart",
        color_column: str = None
) -> str:
    """
    Create a bar chart visualization from SQL query results.

    Args:
        query: SQL query to execute
        x_column: Column name for x-axis
        y_column: Column name for y-axis
        title: Chart title
        color_column: Optional column name for color grouping

    Returns:
        JSON string with chart configuration
    """
    df = execute_query(query)

    logger.info(f"create_bar_chart Executing SQL query: {query}")
    logger.info(f"df: {df}")

    if df is None or df.empty:
        return json.dumps({"error": "No data returned from query"})

    # Check if columns exist
    if x_column not in df.columns or y_column not in df.columns:
        return json.dumps({"error": f"Columns {x_column} or {y_column} not found in query results"})

    if color_column and color_column not in df.columns:
        return json.dumps({"error": f"Color column {color_column} not found in query results"})

    # Create chart data
    if color_column:
        chart_data = []
        for color_val in df[color_column].unique():
            filtered_df = df[df[color_column] == color_val]
            chart_data.append({
                "x": filtered_df[x_column].tolist(),
                "y": filtered_df[y_column].tolist(),
                "type": "bar",
                "name": str(color_val)
            })
    else:
        chart_data = [{
            "x": df[x_column].tolist(),
            "y": df[y_column].tolist(),
            "type": "bar"
        }]

    # Create chart configuration
    chart_config = {
        "title": title,
        "chart_type": "bar",
        "chart_data": {
            "data": chart_data,
            "layout": {
                "title": title,
                "xaxis": {"title": x_column},
                "yaxis": {"title": y_column}
            }
        }
    }

    return json.dumps(chart_config)


@mcp.tool(
    name="create_line_chart",
    description="Create a line chart visualization from SQL query results"
)
async def create_line_chart(
        query: str,
        x_column: str,
        y_column: str,
        title: str = "Line Chart",
        color_column: str = None
) -> str:
    """
    Create a line chart visualization from SQL query results.

    Args:
        query: SQL query to execute
        x_column: Column name for x-axis
        y_column: Column name for y-axis
        title: Chart title
        color_column: Optional column name for color grouping

    Returns:
        JSON string with chart configuration
    """

    df = execute_query(query)

    logger.info(f"create_line_chart Executing SQL query: {query}")
    logger.info(f"df: {df}")

    if df is None or df.empty:
        return json.dumps({"error": "No data returned from query"})

    # Check if columns exist
    if x_column not in df.columns or y_column not in df.columns:
        return json.dumps({"error": f"Columns {x_column} or {y_column} not found in query results"})

    if color_column and color_column not in df.columns:
        return json.dumps({"error": f"Color column {color_column} not found in query results"})

    # Create chart data
    if color_column:
        chart_data = []
        for color_val in df[color_column].unique():
            filtered_df = df[df[color_column] == color_val]
            chart_data.append({
                "x": filtered_df[x_column].tolist(),
                "y": filtered_df[y_column].tolist(),
                "type": "line",
                "name": str(color_val)
            })
    else:
        chart_data = [{
            "x": df[x_column].tolist(),
            "y": df[y_column].tolist(),
            "type": "line"
        }]

    # Create chart configuration
    chart_config = {
        "title": title,
        "chart_type": "line",
        "chart_data": {
            "data": chart_data,
            "layout": {
                "title": title,
                "xaxis": {"title": x_column},
                "yaxis": {"title": y_column}
            }
        }
    }

    return json.dumps(chart_config)


@mcp.tool(
    name="create_pie_chart",
    description="Create a pie chart visualization from SQL query results"
)
async def create_pie_chart(
        query: str,
        labels_column: str,
        values_column: str,
        title: str = "Pie Chart"
) -> str:
    """
    Create a pie chart visualization from SQL query results.

    Args:
        query: SQL query to execute
        labels_column: Column name for pie chart labels
        values_column: Column name for pie chart values
        title: Chart title

    Returns:
        JSON string with chart configuration
    """

    df = execute_query(query)

    logger.info(f"create_pie_chart Executing SQL query: {query}")
    logger.info(f"df: {df}")

    if df is None or df.empty:
        return json.dumps({"error": "No data returned from query"})

    # Check if columns exist
    if labels_column not in df.columns or values_column not in df.columns:
        return json.dumps({"error": f"Columns {labels_column} or {values_column} not found in query results"})

    # Create chart data
    chart_data = [{
        "labels": df[labels_column].tolist(),
        "values": df[values_column].tolist(),
        "type": "pie"
    }]

    # Create chart configuration
    chart_config = {
        "title": title,
        "chart_type": "pie",
        "chart_data": {
            "data": chart_data,
            "layout": {
                "title": title
            }
        }
    }

    return json.dumps(chart_config)


@mcp.tool(
    name="create_scatter_plot",
    description="Create a scatter plot visualization from SQL query results"
)
async def create_scatter_plot(
        query: str,
        x_column: str,
        y_column: str,
        title: str = "Scatter Plot",
        color_column: str = None,
        size_column: str = None
) -> str:
    """
    Create a scatter plot visualization from SQL query results.

    Args:
        query: SQL query to execute
        x_column: Column name for x-axis
        y_column: Column name for y-axis
        title: Chart title
        color_column: Optional column name for color grouping
        size_column: Optional column name for point size

    Returns:
        JSON string with chart configuration
    """

    df = execute_query(query)

    logger.info(f"create_scatter_plot Executing SQL query: {query}")
    logger.info(f"df: {df}")

    if df is None or df.empty:
        return json.dumps({"error": "No data returned from query"})

    # Check if columns exist
    if x_column not in df.columns or y_column not in df.columns:
        return json.dumps({"error": f"Columns {x_column} or {y_column} not found in query results"})

    if color_column and color_column not in df.columns:
        return json.dumps({"error": f"Color column {color_column} not found in query results"})

    if size_column and size_column not in df.columns:
        return json.dumps({"error": f"Size column {size_column} not found in query results"})

    # Create chart data
    if color_column:
        chart_data = []
        for color_val in df[color_column].unique():
            filtered_df = df[df[color_column] == color_val]
            scatter_data = {
                "x": filtered_df[x_column].tolist(),
                "y": filtered_df[y_column].tolist(),
                "mode": "markers",
                "type": "scatter",
                "name": str(color_val)
            }

            if size_column:
                scatter_data["marker"] = {"size": filtered_df[size_column].tolist()}

            chart_data.append(scatter_data)
    else:
        scatter_data = {
            "x": df[x_column].tolist(),
            "y": df[y_column].tolist(),
            "mode": "markers",
            "type": "scatter"
        }

        if size_column:
            scatter_data["marker"] = {"size": df[size_column].tolist()}

        chart_data = [scatter_data]

    # Create chart configuration
    chart_config = {
        "title": title,
        "chart_type": "scatter",
        "chart_data": {
            "data": chart_data,
            "layout": {
                "title": title,
                "xaxis": {"title": x_column},
                "yaxis": {"title": y_column}
            }
        }
    }

    return json.dumps(chart_config)


@mcp.tool(
    name="create_heatmap",
    description="Create a heatmap visualization from SQL query results"
)
async def create_heatmap(
        query: str,
        x_column: str,
        y_column: str,
        z_column: str,
        title: str = "Heatmap"
) -> str:
    """
    Create a heatmap visualization from SQL query results.

    Args:
        query: SQL query to execute
        x_column: Column name for x-axis
        y_column: Column name for y-axis
        z_column: Column name for z-axis (values)
        title: Chart title

    Returns:
        JSON string with chart configuration
    """
    df = execute_query(query)
    if df is None or df.empty:
        return json.dumps({"error": "No data returned from query"})

    # Check if columns exist
    if x_column not in df.columns or y_column not in df.columns or z_column not in df.columns:
        return json.dumps({"error": f"Columns {x_column}, {y_column}, or {z_column} not found in query results"})

    # Pivot the data for heatmap
    try:
        pivot_df = df.pivot(index=y_column, columns=x_column, values=z_column)

        # Create chart data
        chart_data = [{
            "z": pivot_df.values.tolist(),
            "x": pivot_df.columns.tolist(),
            "y": pivot_df.index.tolist(),
            "type": "heatmap"
        }]

        # Create chart configuration
        chart_config = {
            "title": title,
            "chart_type": "heatmap",
            "chart_data": {
                "data": chart_data,
                "layout": {
                    "title": title,
                    "xaxis": {"title": x_column},
                    "yaxis": {"title": y_column}
                }
            }
        }

        return json.dumps(chart_config)
    except Exception as e:
        return json.dumps({"error": f"Error creating heatmap: {str(e)}"})


@mcp.tool(
    name="create_dashboard",
    description="Create a dashboard with multiple visualizations from SQL queries"
)
async def create_dashboard(
        dashboard_title: str,
        chart_configs: str  # JSON string with chart configurations
) -> str:
    """
    Create a dashboard with multiple visualizations from SQL queries.

    Args:
        dashboard_title: Title of the dashboard
        chart_configs: JSON string with chart configurations
            Format: [
                {
                    "chart_type": "bar|line|pie|scatter|heatmap",
                    "query": "SQL query",
                    "x_column": "x column name",
                    "y_column": "y column name",
                    "title": "chart title",
                    ...other chart-specific parameters
                },
                ...
            ]

    Returns:
        JSON string with dashboard configuration
    """
    try:
        configs = json.loads(chart_configs)

        dashboard_charts = []

        for i, config in enumerate(configs):
            chart_type = config.get("chart_type")
            query = config.get("query")

            if not chart_type or not query:
                return json.dumps({"error": f"Chart {i + 1} is missing chart_type or query"})

            df = execute_query(query)
            if df is None or df.empty:
                dashboard_charts.append({
                    "error": f"No data returned from query for chart {i + 1}"
                })
                continue

            if chart_type == "bar":
                x_column = config.get("x_column")
                y_column = config.get("y_column")
                title = config.get("title", f"Bar Chart {i + 1}")
                color_column = config.get("color_column")

                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Bar chart {i + 1} is missing x_column or y_column"
                    })
                    continue

                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i + 1}"
                    })
                    continue

                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i + 1}"
                    })
                    continue

                # Create chart data
                if color_column:
                    chart_data = []
                    for color_val in df[color_column].unique():
                        filtered_df = df[df[color_column] == color_val]
                        chart_data.append({
                            "x": filtered_df[x_column].tolist(),
                            "y": filtered_df[y_column].tolist(),
                            "type": "bar",
                            "name": str(color_val)
                        })
                else:
                    chart_data = [{
                        "x": df[x_column].tolist(),
                        "y": df[y_column].tolist(),
                        "type": "bar"
                    }]

                dashboard_charts.append({
                    "title": title,
                    "chart_type": "bar",
                    "chart_data": {
                        "data": chart_data,
                        "layout": {
                            "title": title,
                            "xaxis": {"title": x_column},
                            "yaxis": {"title": y_column}
                        }
                    }
                })

            elif chart_type == "line":
                x_column = config.get("x_column")
                y_column = config.get("y_column")
                title = config.get("title", f"Line Chart {i + 1}")
                color_column = config.get("color_column")

                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Line chart {i + 1} is missing x_column or y_column"
                    })
                    continue

                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i + 1}"
                    })
                    continue

                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i + 1}"
                    })
                    continue

                # Create chart data
                if color_column:
                    chart_data = []
                    for color_val in df[color_column].unique():
                        filtered_df = df[df[color_column] == color_val]
                        chart_data.append({
                            "x": filtered_df[x_column].tolist(),
                            "y": filtered_df[y_column].tolist(),
                            "type": "line",
                            "name": str(color_val)
                        })
                else:
                    chart_data = [{
                        "x": df[x_column].tolist(),
                        "y": df[y_column].tolist(),
                        "type": "line"
                    }]

                dashboard_charts.append({
                    "title": title,
                    "chart_type": "line",
                    "chart_data": {
                        "data": chart_data,
                        "layout": {
                            "title": title,
                            "xaxis": {"title": x_column},
                            "yaxis": {"title": y_column}
                        }
                    }
                })

            elif chart_type == "pie":
                labels_column = config.get("labels_column")
                values_column = config.get("values_column")
                title = config.get("title", f"Pie Chart {i + 1}")

                if not labels_column or not values_column:
                    dashboard_charts.append({
                        "error": f"Pie chart {i + 1} is missing labels_column or values_column"
                    })
                    continue

                if labels_column not in df.columns or values_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {labels_column} or {values_column} not found in query results for chart {i + 1}"
                    })
                    continue

                # Create chart data
                chart_data = [{
                    "labels": df[labels_column].tolist(),
                    "values": df[values_column].tolist(),
                    "type": "pie"
                }]

                dashboard_charts.append({
                    "title": title,
                    "chart_type": "pie",
                    "chart_data": {
                        "data": chart_data,
                        "layout": {
                            "title": title
                        }
                    }
                })

            elif chart_type == "scatter":
                x_column = config.get("x_column")
                y_column = config.get("y_column")
                title = config.get("title", f"Scatter Plot {i + 1}")
                color_column = config.get("color_column")
                size_column = config.get("size_column")

                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Scatter plot {i + 1} is missing x_column or y_column"
                    })
                    continue

                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i + 1}"
                    })
                    continue

                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i + 1}"
                    })
                    continue

                if size_column and size_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Size column {size_column} not found in query results for chart {i + 1}"
                    })
                    continue

                # Create chart data
                if color_column:
                    chart_data = []
                    for color_val in df[color_column].unique():
                        filtered_df = df[df[color_column] == color_val]
                        scatter_data = {
                            "x": filtered_df[x_column].tolist(),
                            "y": filtered_df[y_column].tolist(),
                            "mode": "markers",
                            "type": "scatter",
                            "name": str(color_val)
                        }

                        if size_column:
                            scatter_data["marker"] = {"size": filtered_df[size_column].tolist()}

                        chart_data.append(scatter_data)
                else:
                    scatter_data = {
                        "x": df[x_column].tolist(),
                        "y": df[y_column].tolist(),
                        "mode": "markers",
                        "type": "scatter"
                    }

                    if size_column:
                        scatter_data["marker"] = {"size": df[size_column].tolist()}

                    chart_data = [scatter_data]

                dashboard_charts.append({
                    "title": title,
                    "chart_type": "scatter",
                    "chart_data": {
                        "data": chart_data,
                        "layout": {
                            "title": title,
                            "xaxis": {"title": x_column},
                            "yaxis": {"title": y_column}
                        }
                    }
                })

            elif chart_type == "heatmap":
                x_column = config.get("x_column")
                y_column = config.get("y_column")
                z_column = config.get("z_column")
                title = config.get("title", f"Heatmap {i + 1}")

                if not x_column or not y_column or not z_column:
                    dashboard_charts.append({
                        "error": f"Heatmap {i + 1} is missing x_column, y_column, or z_column"
                    })
                    continue

                if x_column not in df.columns or y_column not in df.columns or z_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column}, {y_column}, or {z_column} not found in query results for chart {i + 1}"
                    })
                    continue

                # Pivot the data for heatmap
                try:
                    pivot_df = df.pivot(index=y_column, columns=x_column, values=z_column)

                    # Create chart data
                    chart_data = [{
                        "z": pivot_df.values.tolist(),
                        "x": pivot_df.columns.tolist(),
                        "y": pivot_df.index.tolist(),
                        "type": "heatmap"
                    }]

                    dashboard_charts.append({
                        "title": title,
                        "chart_type": "heatmap",
                        "chart_data": {
                            "data": chart_data,
                            "layout": {
                                "title": title,
                                "xaxis": {"title": x_column},
                                "yaxis": {"title": y_column}
                            }
                        }
                    })
                except Exception as e:
                    dashboard_charts.append({
                        "error": f"Error creating heatmap for chart {i + 1}: {str(e)}"
                    })

            else:
                dashboard_charts.append({
                    "error": f"Unsupported chart type '{chart_type}' for chart {i + 1}"
                })

        # Create dashboard configuration
        dashboard_config = {
            "title": dashboard_title,
            "charts": dashboard_charts
        }

        return json.dumps(dashboard_config)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON format for chart_configs"})
    except Exception as e:
        return json.dumps({"error": f"Error creating dashboard: {str(e)}"})


if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
