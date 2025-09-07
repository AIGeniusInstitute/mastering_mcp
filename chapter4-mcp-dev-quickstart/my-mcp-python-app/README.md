Python SDK提供了简洁易用的API，适合快速原型开发和数据科学场景。

#### 安装步骤

1. **创建虚拟环境**：

```bash
# 使用uv（推荐）
uv init my-mcp-python-app
cd my-mcp-python-app
uv venv
source .venv/bin/activate  # Linux/macOS
source .venv/bin/activate.fish  # Fish shell
# 或
.venv\Scripts\activate  # Windows

# 或使用传统方法
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate  # Windows
```

2. **安装MCP SDK**：

```bash
# 使用uv（推荐）
uv add "mcp[cli]"

# 或使用pip
pip install "mcp[cli]"
```

3. **创建项目结构**：

```
my-mcp-python-app/
├── server.py      # MCP服务器代码
├── client.py      # MCP客户端代码
└── requirements.txt
```

#### 基本使用示例

创建一个简单的MCP服务器(server.py)：

```py
from mcp.server.fastmcp import FastMCP

# 初始化FastMCP服务器
mcp = FastMCP("PythonMcpServer",
              # 配置服务器设置
              settings={
                  "streamable_http_path": "/mcp",  # 将 "/mcp" 替换为您想要的路径
                  "port": 8000,  # 将 8000 替换为您想要的端口号
              })


# 定义一个简单的计算器工具
@mcp.tool()
def calculator(operation: str, a: float, b: float) -> str:
    """一个简单的计算器工具

    Args:
        operation: 操作类型，可以是 "add", "subtract", "multiply", "divide"
        a: 第一个操作数
        b: 第二个操作数

    Returns:
        计算结果
    """
    if operation == "add":
        return f"计算结果: {a + b}"
    elif operation == "subtract":
        return f"计算结果: {a - b}"
    elif operation == "multiply":
        return f"计算结果: {a * b}"
    elif operation == "divide":
        if b == 0:
            raise ValueError("除数不能为零")
        return f"计算结果: {a / b}"
    else:
        raise ValueError(f"不支持的操作: {operation}")


# 定义一个动态资源
@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """获取个性化问候

    Args:
        name: 用户名

    Returns:
        问候消息
    """
    return f"你好，{name}！欢迎使用MCP。"


# 定义一个提示模板
@mcp.prompt()
def code_review(code: str) -> str:
    """代码审查提示模板

    Args:
        code: 要审查的代码

    Returns:
        提示模板
    """
    return f"请帮我审查以下代码并提供改进建议：\n\n{code}"


# 运行服务器
if __name__ == "__main__":
    # Run server with streamable_http transport
    # transport = "stdio", "sse", "streamable-http"
    mcp.run(transport="streamable-http")

```


创建一个简单的MCP客户端(client.py)：

```py 
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
import asyncio


async def main():
    # 服务器的URL，根据 server.py 中的配置
    # FastMCP 默认的 streamable_http_path 是 "/mcp"
    # server.py 中配置的 port 是 8000
    server_url = "http://localhost:8000/mcp"

    # 连接到服务器
    async with streamablehttp_client(server_url) as (
        read_stream,
        write_stream,
        _,  # 接收第三个返回值，但不使用它
    ):
        async with ClientSession(read_stream, write_stream) as session:
            # 初始化连接
            # 对于 streamablehttp_client, initialize 通常是需要的
            await session.initialize()
            print("已连接到MCP服务器")

            # 列出所有工具
            tools = await session.list_tools()
            print("可用工具:", [tool.name for tool in tools.tools])

            # 调用计算器工具
            calc_result = await session.call_tool("calculator", {
                "operation": "add",
                "a": 5,
                "b": 3
            })
            # FastMCP tool 返回的是一个字符串，可以直接打印
            print(f"计算器调用结果: {calc_result.content}")


            # 读取问候资源
            # FastMCP resource 返回的是一个字符串
            greeting_content = await session.read_resource("greeting://ModelContextProtocol")
            print(f"问候消息: {greeting_content}")


if __name__ == "__main__":
    asyncio.run(main())
```


## 运行示例

```bash
source .venv/bin/activate.fish

uv run server.py

uv run client.py
```

#### 输出示例

uv run server.py

```
uv run server.py                                              
INFO:     Started server process [32364]
INFO:     Waiting for application startup.
[06/10/25 00:56:09] INFO     StreamableHTTP session manager started                         streamable_http_manager.py:109
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     127.0.0.1:63749 - "POST /mcp HTTP/1.1" 307 Temporary Redirect
[06/10/25 01:04:44] INFO     Created new transport with session ID:                         streamable_http_manager.py:229
                             d47a1075ecda4c46afb94e92b91d7629                                                             
INFO:     127.0.0.1:63749 - "POST /mcp/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:63752 - "GET /mcp HTTP/1.1" 307 Temporary Redirect

```

uv run client.py

``` 
uv run client.py                                            
已连接到MCP服务器
可用工具: ['calculator']
计算器调用结果: [TextContent(type='text', text='计算结果: 8.0', annotations=None)]
问候消息: meta=None contents=[TextResourceContents(uri=AnyUrl('greeting://ModelContextProtocol'), mimeType='text/plain', t'你好，ModelContextProtocol！欢迎使用MCP。')]

```