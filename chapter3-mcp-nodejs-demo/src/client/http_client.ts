// src/client/http_client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function main() {
  console.log("Starting MCP HTTP Client...");

  // 创建HTTP传输
  const transport = new StreamableHTTPClientTransport(
    new URL("http://localhost:3000/mcp")
  );

  // 创建客户端
  const client = new Client({
    name: "MyFirstMcpHttpClient",
    version: "1.0.0"
  });

  try {
    // 连接到服务器
    await client.connect(transport);
    console.log("Connected to MCP HTTP Server");

    // 列出所有资源
    console.log("\n--- 列出所有资源 ---");
    const resources = await client.listResources();
    console.log(JSON.stringify(resources, null, 2));

    // 读取静态资源
    console.log("\n--- 读取配置资源 ---");
    const config = await client.readResource({ uri: "config://app" });
    console.log(JSON.stringify(config, null, 2));

    // 读取动态资源
    console.log("\n--- 读取用户资源 ---");
    const userProfile = await client.readResource({ uri: "users://123/profile" });
    console.log(JSON.stringify(userProfile, null, 2));

    // 列出所有工具
    console.log("\n--- 列出所有工具 ---");
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));

    // 调用计算工具
    console.log("\n--- 调用计算工具 ---");
    const calculationResult = await client.callTool({
      name: "calculate",
      arguments: { operation: "add", a: 5, b: 3 }
    });
    console.log(JSON.stringify(calculationResult, null, 2));

    // 调用大模型API工具
    console.log("\n--- 调用大模型API工具 ---");
    const modelResult = await client.callTool({
      name: "ask-model",
      arguments: { question: "常见的十字花科植物有哪些？" }
    });
    console.log(JSON.stringify(modelResult, null, 2));

    // 列出所有提示
    console.log("\n--- 列出所有提示 ---");
    const prompts = await client.listPrompts();
    console.log(JSON.stringify(prompts, null, 2));

    // 获取提示
    console.log("\n--- 获取问候提示 ---");
    const greetPrompt = await client.getPrompt({
      name: "greet-user",
      arguments: { name: "张三", time: "morning" }
    });
    console.log(JSON.stringify(greetPrompt, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // 关闭连接
    await transport.close();
    console.log("Connection closed");
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});