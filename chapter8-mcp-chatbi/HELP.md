# ChatBI系统：基于MCP、LangGraph、FastAPI和Streamlit的数据分析洞察系统

我将为您开发一个完整的ChatBI系统，该系统可以连接MySQL数据库，进行多轮会话的自然语言取数和可视化报表展示。让我们开始设计和实现这个项目。

## 项目结构

首先，让我们规划项目的文件结构：

```
chatbi/
├── README.md
├── requirements.txt
├── .env
├── docker-compose.yml
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.streamlit
│   └── Dockerfile.mysql
├── src/
│   ├── api/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── chat.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── chat_service.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── graph.py
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── database_tools.py
│   │   │   └── visualization_tools.py
│   │   └── prompts/
│   │       ├── __init__.py
│   │       └── system_prompts.py
│   ├── mcp_servers/
│   │   ├── __init__.py
│   │   ├── database_server.py
│   │   └── visualization_server.py
│   └── streamlit/
│       └── app.py
├── langgraph.json
└── scripts/
    ├── run_api.sh
    ├── run_streamlit.sh
    └── init_db.sql
```

## 实现步骤

让我们逐个实现这些文件：

### 1. 首先创建 requirements.txt

Now, let's create the requirements.txt file:

```python
# requirements.txt
mcp==1.9.1
langgraph==0.0.27
fastapi==0.104.1
streamlit==1.28.0
uvicorn==0.23.2
python-dotenv==1.0.0
mysql-connector-python==8.2.0
pandas==2.1.1
numpy==1.26.0
matplotlib==3.8.0
plotly==5.18.0
langchain-mcp-adapters==0.0.3
langchain-core==0.1.4
langchain-openai==0.0.5
pydantic==2.4.2
python-multipart==0.0.6
```

### 2. Create the .env file

```
# .env
# API Configuration
API_KEY=your_openai_api_key
MODEL=gpt-4-turbo
BASE_URL=https://api.openai.com/v1

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=chatbi
DB_PORT=3306
```

### 3. Create the database initialization script

```sql
-- scripts/init_db.sql
CREATE DATABASE IF NOT EXISTS chatbi;
USE chatbi;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT,
    title VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    chart_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO users (username, email, password_hash) VALUES 
('admin', 'admin@example.com', '$2b$12$1234567890123456789012uQYxg7vLu/GJo/mTq1kJt1UrPmG5GXW'),
('demo', 'demo@example.com', '$2b$12$1234567890123456789012uQYxg7vLu/GJo/mTq1kJt1UrPmG5GXW');

-- Sample tables for BI queries
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    sale_date DATE NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    region VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    join_date DATE NOT NULL
);

-- Insert sample data for products
INSERT INTO products (name, category, supplier, cost_price, selling_price) VALUES
('Laptop', 'Electronics', 'TechCorp', 800.00, 1200.00),
('Smartphone', 'Electronics', 'MobileTech', 400.00, 700.00),
('Desk Chair', 'Furniture', 'FurniCo', 120.00, 250.00),
('Coffee Table', 'Furniture', 'WoodWorks', 180.00, 350.00),
('Headphones', 'Electronics', 'AudioTech', 50.00, 120.00),
('Monitor', 'Electronics', 'ScreenTech', 150.00, 300.00),
('Keyboard', 'Electronics', 'InputCo', 30.00, 80.00),
('Mouse', 'Electronics', 'InputCo', 15.00, 40.00),
('Desk', 'Furniture', 'WoodWorks', 200.00, 400.00),
('Bookshelf', 'Furniture', 'FurniCo', 90.00, 180.00);

-- Insert sample data for customers
INSERT INTO customers (name, email, city, country, join_date) VALUES
('John Smith', 'john@example.com', 'New York', 'USA', '2020-01-15'),
('Emma Johnson', 'emma@example.com', 'London', 'UK', '2020-02-20'),
('Michael Brown', 'michael@example.com', 'Toronto', 'Canada', '2020-03-10'),
('Sophia Garcia', 'sophia@example.com', 'Madrid', 'Spain', '2020-04-05'),
('William Lee', 'william@example.com', 'Sydney', 'Australia', '2020-05-12'),
('Olivia Wilson', 'olivia@example.com', 'Chicago', 'USA', '2020-06-18'),
('James Taylor', 'james@example.com', 'Manchester', 'UK', '2020-07-22'),
('Ava Martinez', 'ava@example.com', 'Mexico City', 'Mexico', '2020-08-30'),
('Alexander Wang', 'alexander@example.com', 'Beijing', 'China', '2020-09-14'),
('Isabella Kim', 'isabella@example.com', 'Seoul', 'South Korea', '2020-10-25');

-- Insert sample data for sales
INSERT INTO sales (product_id, customer_id, sale_date, quantity, unit_price, total_amount, region) VALUES
(1, 1, '2023-01-10', 2, 1200.00, 2400.00, 'North America'),
(2, 2, '2023-01-15', 1, 700.00, 700.00, 'Europe'),
(3, 3, '2023-01-20', 3, 250.00, 750.00, 'North America'),
(4, 4, '2023-01-25', 1, 350.00, 350.00, 'Europe'),
(5, 5, '2023-02-05', 2, 120.00, 240.00, 'Asia Pacific'),
(6, 6, '2023-02-10', 1, 300.00, 300.00, 'North America'),
(7, 7, '2023-02-15', 4, 80.00, 320.00, 'Europe'),
(8, 8, '2023-02-20', 2, 40.00, 80.00, 'Latin America'),
(9, 9, '2023-03-01', 1, 400.00, 400.00, 'Asia Pacific'),
(10, 10, '2023-03-05', 2, 180.00, 360.00, 'Asia Pacific'),
(1, 2, '2023-03-10', 1, 1200.00, 1200.00, 'Europe'),
(2, 3, '2023-03-15', 2, 700.00, 1400.00, 'North America'),
(3, 4, '2023-03-20', 1, 250.00, 250.00, 'Europe'),
(4, 5, '2023-03-25', 2, 350.00, 700.00, 'Asia Pacific'),
(5, 6, '2023-04-01', 3, 120.00, 360.00, 'North America'),
(6, 7, '2023-04-05', 1, 300.00, 300.00, 'Europe'),
(7, 8, '2023-04-10', 2, 80.00, 160.00, 'Latin America'),
(8, 9, '2023-04-15', 3, 40.00, 120.00, 'Asia Pacific'),
(9, 10, '2023-04-20', 1, 400.00, 400.00, 'Asia Pacific'),
(10, 1, '2023-04-25', 2, 180.00, 360.00, 'North America'),
(1, 3, '2023-05-01', 1, 1200.00, 1200.00, 'North America'),
(2, 4, '2023-05-05', 1, 700.00, 700.00, 'Europe'),
(3, 5, '2023-05-10', 2, 250.00, 500.00, 'Asia Pacific'),
(4, 6, '2023-05-15', 1, 350.00, 350.00, 'North America'),
(5, 7, '2023-05-20', 2, 120.00, 240.00, 'Europe'),
(6, 8, '2023-05-25', 1, 300.00, 300.00, 'Latin America'),
(7, 9, '2023-06-01', 3, 80.00, 240.00, 'Asia Pacific'),
(8, 10, '2023-06-05', 2, 40.00, 80.00, 'Asia Pacific'),
(9, 1, '2023-06-10', 1, 400.00, 400.00, 'North America'),
(10, 2, '2023-06-15', 2, 180.00, 360.00, 'Europe');
```

### 4. Create the Docker files

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    build:
      context: .
      dockerfile: docker/Dockerfile.mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: chatbi
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/init_db.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-ppassword"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "8000:8000"
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=chatbi
      - DB_PORT=3306
      - API_KEY=${API_KEY}
      - MODEL=${MODEL}
      - BASE_URL=${BASE_URL}
    volumes:
      - ./src:/app/src

  streamlit:
    build:
      context: .
      dockerfile: docker/Dockerfile.streamlit
    ports:
      - "8501:8501"
    depends_on:
      - api
    environment:
      - API_URL=http://api:8000
    volumes:
      - ./src:/app/src

volumes:
  mysql_data:
```

#### Dockerfile.api

```dockerfile
# docker/Dockerfile.api
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### Dockerfile.streamlit

```dockerfile
# docker/Dockerfile.streamlit
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["streamlit", "run", "src/streamlit/app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

#### Dockerfile.mysql

```dockerfile
# docker/Dockerfile.mysql
FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=password
ENV MYSQL_DATABASE=chatbi

COPY scripts/init_db.sql /docker-entrypoint-initdb.d/
```

### 5. Create the API files

#### Main API file

```python
# src/api/main.py
import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers import chat
from .database import get_db, engine
from . import models

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChatBI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ChatBI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### Database Configuration

```python
# src/api/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "chatbi")
DB_PORT = os.getenv("DB_PORT", "3306")

# Create SQLAlchemy engine
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### Models

```python
# src/api/models.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversations = relationship("Conversation", back_populates="user")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    visualizations = relationship("Visualization", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")

class Visualization(Base):
    __tablename__ = "visualizations"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    chart_type = Column(String(50), nullable=False)
    chart_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="visualizations")
```

#### Config

```python
# src/api/config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_KEY = os.getenv("API_KEY")
MODEL = os.getenv("MODEL", "gpt-4-turbo")
BASE_URL = os.getenv("BASE_URL", "https://api.openai.com/v1")

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = os.getenv("DB_NAME", "chatbi")
DB_PORT = os.getenv("DB_PORT", "3306")
```

#### Chat Router

```python
# src/api/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import Conversation, Message, Visualization
from ..services.chat_service import process_chat_message

router = APIRouter()

class MessageCreate(BaseModel):
    content: str
    role: str = "user"

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    
    class Config:
        orm_mode = True

class ConversationCreate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: int
    title: str
    messages: List[MessageResponse] = []
    
    class Config:
        orm_mode = True

class VisualizationResponse(BaseModel):
    id: int
    title: str
    chart_type: str
    chart_data: dict
    
    class Config:
        orm_mode = True

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(conversation: ConversationCreate, db: Session = Depends(get_db)):
    # For simplicity, we're using user_id=1 (admin user)
    db_conversation = Conversation(title=conversation.title, user_id=1)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_db)):
    # For simplicity, we're using user_id=1 (admin user)
    conversations = db.query(Conversation).filter(Conversation.user_id == 1).all()
    return conversations

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    conversation_id: int, 
    message: MessageCreate, 
    db: Session = Depends(get_db)
):
    # Check if conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Save user message
    db_message = Message(
        conversation_id=conversation_id,
        role=message.role,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Get all messages in the conversation for context
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).all()
    message_history = [{"role": msg.role, "content": msg.content} for msg in messages]
    
    # Process the message with the AI
    response_content, visualizations = await process_chat_message(message_history, db)
    
    # Save AI response
    ai_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=response_content
    )
    db.add(ai_message)
    
    # Save any visualizations
    for viz in visualizations:
        db_viz = Visualization(
            conversation_id=conversation_id,
            title=viz["title"],
            chart_type=viz["chart_type"],
            chart_data=viz["chart_data"]
        )
        db.add(db_viz)
    
    db.commit()
    db.refresh(ai_message)
    
    # Update conversation title if it's the first message
    if len(messages) == 1:  # Only the user message we just added
        conversation.title = message.content[:50] + "..." if len(message.content) > 50 else message.content
        db.commit()
    
    return ai_message

@router.get("/conversations/{conversation_id}/visualizations", response_model=List[VisualizationResponse])
def get_visualizations(conversation_id: int, db: Session = Depends(get_db)):
    visualizations = db.query(Visualization).filter(Visualization.conversation_id == conversation_id).all()
    return visualizations
```

#### Chat Service

```python
# src/api/services/chat_service.py
import os
import json
from typing import List, Dict, Tuple, Any
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import asyncio

from langchain_openai import ChatOpenAI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

# Load environment variables
load_dotenv()

async def process_chat_message(
    message_history: List[Dict[str, str]], 
    db: Session
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Process a chat message using the LangGraph agent.
    
    Args:
        message_history: List of message dictionaries with 'role' and 'content'
        db: Database session
        
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
    tools = await mcp_client.get_tools()
    
    # Create the agent
    agent = create_react_agent(model, tools)
    
    # Format the message history for the agent
    formatted_messages = []
    for msg in message_history:
        formatted_messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Invoke the agent
    response = await agent.ainvoke({"messages": formatted_messages})
    
    # Extract the response content
    response_content = ""
    for msg in response.get("messages", []):
        if "ai" in msg:
            response_content = msg["ai"]
    
    # Extract visualizations from the response
    visualizations = []
    # This is a simplified approach - in a real implementation, 
    # you would parse the response to extract visualization data
    # For now, we'll check if there are any visualization markers in the response
    if "```json" in response_content and "```" in response_content:
        try:
            # Extract JSON blocks from the response
            json_blocks = []
            parts = response_content.split("```json")
            for i in range(1, len(parts)):
                if "```" in parts[i]:
                    json_text = parts[i].split("```")[0].strip()
                    json_blocks.append(json_text)
            
            # Process each JSON block as a visualization
            for json_block in json_blocks:
                viz_data = json.loads(json_block)
                if "chart_type" in viz_data and "chart_data" in viz_data:
                    visualizations.append({
                        "title": viz_data.get("title", "Visualization"),
                        "chart_type": viz_data["chart_type"],
                        "chart_data": viz_data["chart_data"]
                    })
        except Exception as e:
            print(f"Error extracting visualizations: {e}")
    
    return response_content, visualizations
```

### 6. Create the MCP Servers

#### Database MCP Server

```python
# src/mcp_servers/database_server.py
import os
import mysql.connector
import pandas as pd
import json
from mcp.server.fastmcp import FastMCP
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Database Query Provider", port=8002)

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
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
```

#### Visualization MCP Server

```python
# src/mcp_servers/visualization_server.py
import json
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
from mcp.server.fastmcp import FastMCP
import asyncio
import mysql.connector
import os
from dotenv import load_dotenv
import plotly.express as px
import plotly.graph_objects as go
import numpy as np

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Visualization Provider", port=8003)

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
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
                return json.dumps({"error": f"Chart {i+1} is missing chart_type or query"})
            
            df = execute_query(query)
            if df is None or df.empty:
                dashboard_charts.append({
                    "error": f"No data returned from query for chart {i+1}"
                })
                continue
            
            if chart_type == "bar":
                x_column = config.get("x_column")
                y_column = config.get("y_column")
                title = config.get("title", f"Bar Chart {i+1}")
                color_column = config.get("color_column")
                
                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Bar chart {i+1} is missing x_column or y_column"
                    })
                    continue
                
                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i+1}"
                    })
                    continue
                
                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i+1}"
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
                title = config.get("title", f"Line Chart {i+1}")
                color_column = config.get("color_column")
                
                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Line chart {i+1} is missing x_column or y_column"
                    })
                    continue
                
                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i+1}"
                    })
                    continue
                
                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i+1}"
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
                title = config.get("title", f"Pie Chart {i+1}")
                
                if not labels_column or not values_column:
                    dashboard_charts.append({
                        "error": f"Pie chart {i+1} is missing labels_column or values_column"
                    })
                    continue
                
                if labels_column not in df.columns or values_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {labels_column} or {values_column} not found in query results for chart {i+1}"
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
                title = config.get("title", f"Scatter Plot {i+1}")
                color_column = config.get("color_column")
                size_column = config.get("size_column")
                
                if not x_column or not y_column:
                    dashboard_charts.append({
                        "error": f"Scatter plot {i+1} is missing x_column or y_column"
                    })
                    continue
                
                if x_column not in df.columns or y_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column} or {y_column} not found in query results for chart {i+1}"
                    })
                    continue
                
                if color_column and color_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Color column {color_column} not found in query results for chart {i+1}"
                    })
                    continue
                
                if size_column and size_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Size column {size_column} not found in query results for chart {i+1}"
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
                title = config.get("title", f"Heatmap {i+1}")
                
                if not x_column or not y_column or not z_column:
                    dashboard_charts.append({
                        "error": f"Heatmap {i+1} is missing x_column, y_column, or z_column"
                    })
                    continue
                
                if x_column not in df.columns or y_column not in df.columns or z_column not in df.columns:
                    dashboard_charts.append({
                        "error": f"Columns {x_column}, {y_column}, or {z_column} not found in query results for chart {i+1}"
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
                        "error": f"Error creating heatmap for chart {i+1}: {str(e)}"
                    })
            
            else:
                dashboard_charts.append({
                    "error": f"Unsupported chart type '{chart_type}' for chart {i+1}"
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
```

### 7. Create the LangGraph Agent

```python
# src/agents/graph.py
from typing import Dict, List, Tuple, Any, TypedDict, Annotated, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        
        # System message with instructions
        system_message = """You are ChatBI, an advanced business intelligence assistant that helps users analyze data and create visualizations.
        
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
        """
        
        # Add system message if it's the first interaction
        if len(messages) == 1 and isinstance(messages[0], HumanMessage):
            messages = [
                HumanMessage(content=system_message),
                *messages
            ]
        
        # Call the model
        response = model.bind(tools=tools).invoke(messages)
        
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
```

### 8. Create the Streamlit App

```python
# src/streamlit/app.py
import streamlit as st
import requests
import json
import datetime
import plotly.graph_objects as go
import pandas as pd
from plotly.subplots import make_subplots
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API URL
API_URL = os.getenv("API_URL", "http://localhost:8000")

def query_chatbi_api(endpoint, method="GET", data=None):
    """Query the ChatBI API."""
    url = f"{API_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error connecting to API: {e}")
        return None

def render_visualization(viz_data):
    """Render a visualization based on its type and data."""
    try:
        chart_type = viz_data["chart_type"]
        chart_data = viz_data["chart_data"]
        
        if chart_type == "bar":
            fig = go.Figure()
            for trace in chart_data["data"]:
                fig.add_trace(go.Bar(
                    x=trace["x"],
                    y=trace["y"],
                    name=trace.get("name", "")
                ))
            fig.update_layout(
                title=chart_data["layout"]["title"],
                xaxis_title=chart_data["layout"]["xaxis"]["title"],
                yaxis_title=chart_data["layout"]["yaxis"]["title"]
            )
            return fig
        
        elif chart_type == "line":
            fig = go.Figure()
            for trace in chart_data["data"]:
                fig.add_trace(go.Scatter(
                    x=trace["x"],
                    y=trace["y"],
                    mode="lines+markers",
                    name=trace.get("name", "")
                ))
            fig.update_layout(
                title=chart_data["layout"]["title"],
                xaxis_title=chart_data["layout"]["xaxis"]["title"],
                yaxis_title=chart_data["layout"]["yaxis"]["title"]
            )
            return fig
        
        elif chart_type == "pie":
            fig = go.Figure()
            for trace in chart_data["data"]:
                fig.add_trace(go.Pie(
                    labels=trace["labels"],
                    values=trace["values"],
                    name=trace.get("name", "")
                ))
            fig.update_layout(
                title=chart_data["layout"]["title"]
            )
            return fig
        
        elif chart_type == "scatter":
            fig = go.Figure()
            for trace in chart_data["data"]:
                marker = {}
                if "marker" in trace:
                    marker = trace["marker"]
                fig.add_trace(go.Scatter(
                    x=trace["x"],
                    y=trace["y"],
                    mode="markers",
                    name=trace.get("name", ""),
                    marker=marker
                ))
            fig.update_layout(
                title=chart_data["layout"]["title"],
                xaxis_title=chart_data["layout"]["xaxis"]["title"],
                yaxis_title=chart_data["layout"]["yaxis"]["title"]
            )
            return fig
        
        elif chart_type == "heatmap":
            fig = go.Figure()
            for trace in chart_data["data"]:
                fig.add_trace(go.Heatmap(
                    z=trace["z"],
                    x=trace["x"],
                    y=trace["y"]
                ))
            fig.update_layout(
                title=chart_data["layout"]["title"],
                xaxis_title=chart_data["layout"]["xaxis"]["title"],
                yaxis_title=chart_data["layout"]["yaxis"]["title"]
            )
            return fig
        
        else:
            st.warning(f"Unsupported chart type: {chart_type}")
            return None
    
    except Exception as e:
        st.error(f"Error rendering visualization: {e}")
        return None

def main():
    # Set up the page
    st.set_page_config(page_title="ChatBI", layout="wide")
    st.title("ChatBI - Data Analysis Assistant")
    
    # Initialize session state
    if "conversations" not in st.session_state:
        st.session_state.conversations = []
        # Fetch conversations from API
        conversations = query_chatbi_api("/api/chat/conversations")
        if conversations:
            st.session_state.conversations = conversations
    
    if "active_conversation_id" not in st.session_state:
        st.session_state.active_conversation_id = None
    
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    if "visualizations" not in st.session_state:
        st.session_state.visualizations = []
    
    # Create sidebar
    with st.sidebar:
        st.header("Conversations")
        
        # New conversation button
        if st.button("New Conversation"):
            # Create a new conversation
            new_conversation = query_chatbi_api(
                "/api/chat/conversations", 
                method="POST", 
                data={"title": "New Conversation"}
            )
            if new_conversation:
                st.session_state.conversations.append(new_conversation)
                st.session_state.active_conversation_id = new_conversation["id"]
                st.session_state.messages = []
                st.session_state.visualizations = []
                st.rerun()
        
        # List conversations
        for conv in st.session_state.conversations:
            if st.button(f"{conv['title']}", key=f"conv_{conv['id']}"):
                st.session_state.active_conversation_id = conv["id"]
                # Fetch conversation details
                conversation = query_chatbi_api(f"/api/chat/conversations/{conv['id']}")
                if conversation:
                    st.session_state.messages = conversation["messages"]
                    # Fetch visualizations
                    visualizations = query_chatbi_api(f"/api/chat/conversations/{conv['id']}/visualizations")
                    st.session_state.visualizations = visualizations if visualizations else []
                st.rerun()
    
    # Main content area
    if st.session_state.active_conversation_id is None:
        st.info("Select a conversation from the sidebar or create a new one.")
    else:
        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
        
        # Display visualizations
        if st.session_state.visualizations:
            st.header("Visualizations")
            cols = st.columns(2)
            for i, viz in enumerate(st.session_state.visualizations):
                with cols[i % 2]:
                    st.subheader(viz["title"])
                    fig = render_visualization(viz)
                    if fig:
                        st.plotly_chart(fig, use_container_width=True)
        
        # Chat input
        if prompt := st.chat_input("Ask a question about your data..."):
            # Add user message to chat
            with st.chat_message("user"):
                st.markdown(prompt)
            
            # Add user message to state
            st.session_state.messages.append({"role": "user", "content": prompt})
            
            # Send message to API
            with st.spinner("Thinking..."):
                response = query_chatbi_api(
                    f"/api/chat/conversations/{st.session_state.active_conversation_id}/messages",
                    method="POST",
                    data={"content": prompt}
                )
                
                if response:
                    # Add assistant message to chat
                    with st.chat_message("assistant"):
                        st.markdown(response["content"])
                    
                    # Add assistant message to state
                    st.session_state.messages.append({"role": "assistant", "content": response["content"]})
                    
                    # Refresh visualizations
                    visualizations = query_chatbi_api(f"/api/chat/conversations/{st.session_state.active_conversation_id}/visualizations")
                    st.session_state.visualizations = visualizations if visualizations else []
                    
                    # Rerun to update UI
                    st.rerun()

if __name__ == "__main__":
    main()
```

### 9. Create the LangGraph JSON file

```json
// langgraph.json
{
    "dependencies": ["."],
    "graphs": {
      "chatbi": "./src/agents/graph.py:make_graph"
    }
}
```

### 10. Create the README.md file


### 11. Create the run scripts

```bash
# scripts/run_api.sh
#!/bin/bash
cd "$(dirname "$0")/.."
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
# scripts/run_streamlit.sh
#!/bin/bash
cd "$(dirname "$0")/.."
streamlit run src/streamlit/app.py
```

## 完整项目总结

我们已经创建了一个完整的ChatBI系统，它具有以下特点：

1. **多轮会话**: 用户可以进行多轮对话，系统会保持上下文理解。
2. **自然语言取数**: 用户可以用自然语言描述他们想要的数据，系统会自动生成SQL查询。
3. **可视化报表**: 系统可以根据数据自动生成适合的可视化图表。
4. **数据分析洞察**: 系统不仅提供原始数据，还会提供数据分析和洞察。

### 核心组件

1. **MCP服务器**: 提供数据库查询和可视化功能的工具。
2. **LangGraph Agent**: 使用ReAct模式处理用户请求，决定何时查询数据库或生成可视化。
3. **FastAPI后端**: 处理用户请求，管理会话和消息。
4. **Streamlit前端**: 提供用户友好的界面，显示对话和可视化。
5. **MySQL数据库**: 存储业务数据和系统数据。

### 运行方式

1. 使用Docker Compose启动所有服务:
   ```
   docker-compose up --build
   ```

2. 访问Streamlit UI: http://localhost:8501
3. 创建新会话并开始提问

### 示例查询

- "显示各地区的总销售额"
- "哪些产品的销售量最高？"
- "创建一个按月份显示销售趋势的图表"
- "比较不同产品类别的销售表现"

这个系统可以根据需要进一步扩展，例如添加更多的可视化类型、支持更复杂的数据分析或集成更多的数据源。