# src/mcp_servers/database_server.py
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
mcp = FastMCP("Database Query Provider", port=8002)

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
    """Execute a SQL query and return the results."""
    connection = get_db_connection()
    if not connection:
        return {"error": "Failed to connect to the database"}

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query)

        # Check if the query is a SELECT query
        if cursor.description:
            results = cursor.fetchall()
            return results
        else:
            connection.commit()
            return {"affected_rows": cursor.rowcount}
    except mysql.connector.Error as err:
        return {"error": str(err)}
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


@mcp.tool(
    name="get_table_schema",
    description="Get the schema of a specific table in the database"
)
async def get_table_schema(table_name: str) -> str:
    """Get the schema of a specific table in the database."""

    logger.info(f"Fetching schema for table: {table_name}")

    connection = get_db_connection()
    if not connection:
        return "Failed to connect to the database"

    try:
        cursor = connection.cursor()
        cursor.execute(f"DESCRIBE {table_name}")
        columns = cursor.fetchall()

        schema_info = f"Schema for table '{table_name}':\n"
        for col in columns:
            schema_info += f"- {col[0]}: {col[1]}"
            if col[2] == "NO":  # NOT NULL
                schema_info += " (NOT NULL)"
            if col[3] == "PRI":  # Primary Key
                schema_info += " (PRIMARY KEY)"
            if col[4]:  # Default value
                schema_info += f" (DEFAULT: {col[4]})"
            schema_info += "\n"

        return schema_info
    except mysql.connector.Error as err:
        return f"Error retrieving schema for table '{table_name}': {err}"
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


@mcp.tool(
    name="list_tables",
    description="List all tables in the database"
)
async def list_tables() -> str:
    """List all tables in the database."""

    logger.info("Listing all tables in the database")

    connection = get_db_connection()
    if not connection:
        return "Failed to connect to the database"

    try:
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()

        table_list = "Tables in the database:\n"
        for table in tables:
            table_list += f"- {table[0]}\n"

        return table_list
    except mysql.connector.Error as err:
        return f"Error listing tables: {err}"
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


@mcp.tool(
    name="execute_sql_query",
    description="Execute a SQL query on the database and return the results"
)
async def execute_sql_query(query: str) -> str:
    """Execute a SQL query and return the results."""

    logger.info(f"Executing SQL query: {query}")

    results = execute_query(query)

    if isinstance(results, dict) and "error" in results:
        return f"Error executing query: {results['error']}"

    if isinstance(results, dict) and "affected_rows" in results:
        return f"Query executed successfully. Affected rows: {results['affected_rows']}"

    # Convert results to a formatted string
    if not results:
        return "Query executed successfully. No results returned."

    # Convert to DataFrame for better formatting
    df = pd.DataFrame(results)
    return df.to_string()


@mcp.tool(
    name="execute_sql_query_json",
    description="Execute a SQL query and return the results as JSON"
)
async def execute_sql_query_json(query: str) -> str:
    """Execute a SQL query and return the results as JSON."""

    logger.info(f"Executing SQL query: {query}")

    results = execute_query(query)

    if isinstance(results, dict) and "error" in results:
        return json.dumps({"error": results["error"]})

    if isinstance(results, dict) and "affected_rows" in results:
        return json.dumps({"affected_rows": results["affected_rows"]})

    # Return results as JSON
    return json.dumps(results, default=str)


@mcp.tool(
    name="get_table_sample",
    description="Get a sample of rows from a specific table"
)
async def get_table_sample(table_name: str, limit: int = 5) -> str:
    """Get a sample of rows from a specific table."""
    query = f"SELECT * FROM {table_name} LIMIT {limit}"
    results = execute_query(query)

    logger.info(f"Fetching sample from table: {table_name}")
    logger.info(f"Query: {query}")
    logger.info(f"Results: {results}")

    if isinstance(results, dict) and "error" in results:
        return f"Error retrieving sample from table '{table_name}': {results['error']}"

    # Convert results to a formatted string
    if not results:
        return f"No data found in table '{table_name}'."

    # Convert to DataFrame for better formatting
    df = pd.DataFrame(results)
    return df.to_string()


@mcp.tool(
    name="get_database_stats",
    description="Get statistics about the database tables"
)
async def get_database_stats() -> str:
    """Get statistics about the database tables."""
    connection = get_db_connection()
    if not connection:
        return "Failed to connect to the database"

    try:
        cursor = connection.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()

        stats = "Database Statistics:\n"
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            stats += f"- {table_name}: {count} rows\n"

        return stats
    except mysql.connector.Error as err:
        return f"Error retrieving database statistics: {err}"
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


if __name__ == "__main__":
    asyncio.run(mcp.run_sse_async())
