# mcp-chatbi



# ChatBI - 智能数据分析洞察系统

ChatBI是一个基于自然语言的数据分析系统，允许用户通过对话方式查询和可视化MySQL数据库中的数据。该系统利用了最新的AI技术，包括MCP、LangGraph、FastAPI和Streamlit，为用户提供了一个直观、强大的数据分析工具。

## 主要特性

- **自然语言查询**：使用自然语言描述您想要的数据，系统会自动转换为SQL查询
- **多轮对话**：支持上下文感知的多轮对话，使数据探索更加自然
- **数据可视化**：自动生成适合数据特性的可视化图表
- **数据库连接**：无缝连接到MySQL数据库
- **用户友好界面**：基于Streamlit构建的直观界面

## 技术栈

- **MCP (Model Context Protocol)**：用于构建工具和资源的标准化接口
- **LangGraph**：用于构建多轮对话流程的框架
- **FastAPI**：提供高性能的API服务
- **Streamlit**：构建用户友好的前端界面
- **MySQL**：数据存储和查询

## 快速开始

### 前提条件

- Python 3.9+
- MySQL数据库
- Docker (可选，用于容器化部署)

### 安装

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/chatbi.git
cd chatbi
```

2. 安装依赖：

```bash
conda create -n mcp-chatbi python=3.10
conda activate mcp-chatbi

pip install -r requirements.txt
```

3. 配置环境变量：

创建一个`.env`文件，包含以下内容：

```
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# API配置
API_KEY=your_openai_api_key
MODEL=gpt-4
BASE_URL=https://api.openai.com/v1
```

### 运行

使用提供的脚本启动应用：

```bash
./run_app.sh
```

或者手动启动各个组件：

1. 启动数据库服务器：

```bash
python src/database_server.py
```

2. 启动客户端服务器：

```bash
python src/client_server.py
```

3. 启动Streamlit界面：

```bash
streamlit run src/streamlit_app.py
```

## 使用Docker

使用Docker Compose启动所有服务：

```bash
docker-compose up --build
```

## 使用方法

1. 打开浏览器访问 `http://localhost:8501`
2. 在聊天界面中，使用自然语言提问，例如：
   - "显示销售额最高的前10个产品"
   - "按月份统计2023年的总收入，并生成柱状图"
   - "比较不同地区的销售表现，用饼图展示"

## 项目结构

```
.
├── README.md                  # 项目说明文档
├── assets                     # 静态资源
├── docker                     # Docker配置文件
├── docker-compose.yml         # Docker Compose配置
├── requirements.txt           # 项目依赖
├── run_app.sh                 # 启动脚本
├── src
│   ├── client_server.py       # 客户端服务器
│   ├── database_server.py     # 数据库服务器
│   ├── graph.py               # LangGraph图定义
│   ├── langgraph.json         # LangGraph配置
│   ├── streamlit_app.py       # Streamlit前端应用
│   └── utils                  # 工具函数
└── tests                      # 测试文件
```

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请参阅[贡献指南](CONTRIBUTING.md)了解更多信息。

## 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。



-----


# ChatBI System

ChatBI is an advanced business intelligence assistant that helps users analyze data and create visualizations through natural language conversations. It connects to MySQL databases, performs data analysis, and generates interactive visualizations based on user queries.

## Features

- Natural language interface for database queries
- Multi-turn conversations for complex data analysis
- Interactive data visualizations
- SQL query generation and execution
- Data insights and recommendations

## Architecture

The system is built using the following technologies:

- **MCP (Model Context Protocol)**: For connecting LLMs to external tools
- **LangGraph**: For building the conversational agent with reasoning capabilities
- **FastAPI**: For the backend API
- **Streamlit**: For the user interface
- **MySQL**: For data storage

## Getting Started

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (or compatible API)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chatbi.git
   cd chatbi
   ```

2. Create a `.env` file with your configuration:
   ```
   API_KEY=your_openai_api_key
   MODEL=gpt-4-turbo
   BASE_URL=https://api.openai.com/v1
   ```

3. Start the application using Docker Compose:
   ```
   docker-compose up --build
   ```

4. Access the application:
   - Streamlit UI: http://localhost:8501
   - API: http://localhost:8000

## Usage

1. Open the Streamlit UI in your browser
2. Create a new conversation
3. Ask questions about your data in natural language
4. View the generated visualizations and insights

Example queries:
- "Show me the total sales by region"
- "What are the top 5 products by revenue?"
- "Create a monthly sales trend visualization for the last 6 months"
- "Compare sales performance across different product categories"

## Project Structure

- `src/api/`: FastAPI backend
- `src/agents/`: LangGraph agent implementation
- `src/mcp_servers/`: MCP servers for database and visualization
- `src/streamlit/`: Streamlit UI
- `docker/`: Docker configuration files
- `scripts/`: Utility scripts and database initialization

## License

This project is licensed under the MIT License - see the LICENSE file for details.


------


# ChatBI System with LangGraph, MCP, FastAPI, Streamlit, and MySQL

This project implements a multi-turn conversational data analysis and visualization system. Users can interact with a MySQL database using natural language.

## Features

*   Natural Language to SQL generation.
*   Database schema awareness.
*   Multi-turn conversation support.
*   Data visualization suggestions and rendering (Bar, Line, Table).
*   Modular architecture using MCP for database interactions.
*   FastAPI backend for agent logic.
*   Streamlit frontend for user interaction.
*   Dockerized for easy deployment.

## Architecture

1.  **Streamlit UI (`streamlit_chatbi_app.py`):** Frontend for user interaction.
2.  **ChatBI Server (`chatbi_server.py`):** FastAPI application that:
    *   Hosts the LangGraph ReAct agent (`graph.py`).
    *   Communicates with the `mysql-mcp-server` for database operations.
    *   Processes user queries and returns natural language responses and visualization suggestions.
3.  **MySQL MCP Server (`mysql_mcp_server.py`):** MCP server that exposes tools to:
    *   Fetch database schema.
    *   Execute SQL queries against the MySQL database.
4.  **MySQL Database:** The target database for data analysis. (Can be a Docker service or external).
5.  **LangGraph Agent (`graph.py`):** Orchestrates the interaction between the LLM and the MCP tools to answer user questions.

## Setup and Running

### Prerequisites

*   Docker & Docker Compose
*   An OpenAI API Key (or other compatible LLM provider configured in `.env`)
*   A MySQL database (the `docker-compose.yml` can set one up for you).

### Steps

1.  **Clone the repository (if applicable):**
    ```bash
    # git clone ...
    # cd your_project_directory
    ```

2.  **Create and configure `.env` file:**
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    nano .env # Or your favorite editor
    ```
    Ensure `DB_HOST` in `.env` is set to `mysql-db` for the `mysql-mcp-server` to connect to the MySQL Docker container.
    The `API_KEY` for your LLM (e.g., OpenAI) is crucial.

3.  **Prepare your MySQL Database (Optional but Recommended):**
    *   If using the provided `mysql-db` service in `docker-compose.yml`, it will initialize with the user and database specified in your `.env` file.
    *   To load initial data:
        *   Create an `init_db.sql` file in the root of your project (or a specified path).
        *   Uncomment the volume mount for `init_db.sql` in `docker-compose.yml` under the `mysql-db` service:
            ```yaml
            volumes:
              - mysql_data:/var/lib/mysql
              - ./init_db.sql:/docker-entrypoint-initdb.d/init_db.sql 
            ```
        *   Your `init_db.sql` should contain `CREATE TABLE` and `INSERT INTO` statements. Make sure to `USE your_db_name;` at the beginning of the script, where `your_db_name` matches `DB_NAME` in your `.env`.

4.  **Build and run with Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs it in detached mode. Omit it to see logs directly, or use `docker-compose logs -f` to follow logs.

5.  **Access the application:**
    *   Streamlit UI: Open your browser to `http://localhost:STREAMLIT_PORT` (e.g., `http://localhost:8501` if using default).
    *   ChatBI API (FastAPI): `http://localhost:CHATBI_SERVER_PORT/docs` (e.g., `http://localhost:8080/docs`).
    *   MySQL MCP Server: `http://localhost:MYSQL_MCP_PORT/tools` (e.g., `http://localhost:8001/tools`).

### Stopping the application:
    ```bash
    docker-compose down
    ```
    To remove volumes (like MySQL data):
    ```bash
    docker-compose down -v
    ```

## Development Notes

*   **LLM System Prompt:** The system prompt in `graph.py` is critical for guiding the LLM's behavior, SQL generation, and visualization suggestions. Adjust it based on your specific database schema and desired interaction style.
*   **Error Handling:** The current error handling is basic. Robust production systems would require more sophisticated error logging, retries, and user feedback.
*   **Security:**
    *   Ensure your `.env` file is not committed to version control.
    *   Be cautious about directly executing LLM-generated SQL, especially in environments with sensitive data or write access. The current setup assumes a read-only analytical context. Implement safeguards if write operations are ever considered.
    *   Network policies and proper authentication/authorization for APIs are essential for production.
*   **Visualization:** The `streamlit_chatbi_app.py` has basic visualization rendering. For more advanced charts, consider integrating libraries like Plotly, Altair, or Vega-Lite. The agent needs to be prompted to provide data in a format suitable for these libraries.
*   **MySQL Schema Tool:** The `get_database_schema` tool currently fetches basic schema. For complex databases, you might want to enhance it to include primary/foreign key relationships, table descriptions, or sample data to give the LLM better context.
