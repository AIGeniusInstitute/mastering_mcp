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
