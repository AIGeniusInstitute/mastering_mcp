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