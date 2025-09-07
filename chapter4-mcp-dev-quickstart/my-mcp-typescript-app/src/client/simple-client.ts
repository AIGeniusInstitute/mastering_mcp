import {Client} from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"; // Removed
import {StreamableHTTPClientTransport} from "@modelcontextprotocol/sdk/client/streamableHttp.js"; // Added

async function main() {
    // 创建客户端传输，连接到HTTP服务器
    const transport = new StreamableHTTPClientTransport(
        new URL("http://localhost:3000/mcp")
    );

    // 创建客户端
    const client = new Client({
        name: "SimpleMcpClient",
        version: "1.0.0"
    });

    try {
        // 连接到服务器
        // 对于 StreamableHTTPClientTransport，连接通常在第一次API调用时隐式建立，
        // 或者可以显式调用 initialize（如果SDK提供此方法并需要）
        // 这里我们假设 connect 仍然是合适的，或者SDK内部处理了HTTP的连接语义
        await client.connect(transport);
        console.log("已连接到MCP服务器 (或准备好通过HTTP发送请求)");

        // 列出所有资源
        const resources = await client.listResources();
        console.log("可用资源:", resources);

        // 列出所有提示词
        const prompts = await client.listPrompts();
        console.log("可用提示词:", JSON.stringify(prompts));

        // 列出所有工具
        const tools = await client.listTools();
        console.log("可用工具:", JSON.stringify(tools));

        // 调用计算器工具
        const calcResult = await client.callTool({
            name: "calculator",
            arguments: {
                operation: "add",
                a: 5,
                b: 3
            }
        });
        console.log("计算结果:", calcResult);

        // 读取问候资源
        const greeting = await client.readResource({
            uri: "greeting://ModelContextProtocol"
        });

        console.log("问候消息:", greeting);

    } catch (error) {
        console.error("错误:", error);
    } finally {
        // 关闭连接
        // 对于 StreamableHTTPClientTransport，close 可能涉及发送一个DELETE请求来终止会话
        await transport.close();
        console.log("MCP会话已关闭");
    }
}

main().catch(console.error);