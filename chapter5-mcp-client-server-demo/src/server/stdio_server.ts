import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建MCP服务器实例
const server = new McpServer({
  name: "MyFirstMcpServer",
  version: "1.0.0"
});

// 添加静态资源
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: "这是应用程序的配置信息。\n版本: 1.0.0\n环境: development"
    }]
  })
);

// 添加动态资源
server.resource(
  "user-profile",
  new ResourceTemplate("users://{userId}/profile", { list: undefined }),
  async (uri, { userId }) => ({
    contents: [{
      uri: uri.href,
      text: `用户ID: ${userId}\n姓名: 用户${userId}\n注册时间: ${new Date().toISOString()}`
    }]
  })
);

// 添加计算工具
server.tool(
  "calculate",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]),
    a: z.number(),
    b: z.number()
  },
  async ({ operation, a, b }) => {
    let result: number;
    
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          return {
            content: [{ type: "text", text: "错误: 除数不能为零" }],
            isError: true
          };
        }
        result = a / b;
        break;
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `计算结果: ${a} ${operation} ${b} = ${result}` 
      }]
    };
  }
);

// 添加天气查询工具
server.tool(
  "get-weather",
  { city: z.string() },
  async ({ city }) => {
    // 模拟API调用
    const weather = {
      "北京": "晴天，25°C",
      "上海": "多云，28°C",
      "广州": "雨天，30°C",
      "深圳": "阴天，29°C"
    };
    
    const cityWeather = city in weather 
      ? weather[city as keyof typeof weather] 
      : "未知城市或天气数据不可用";
    
    return {
      content: [{ 
        type: "text", 
        text: `${city}的天气: ${cityWeather}` 
      }]
    };
  }
);

// 添加提示模板
server.prompt(
  "greet-user",
  { 
    name: z.string(),
    time: z.enum(["morning", "afternoon", "evening"]).optional()
  },
  ({ name, time }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `请用${time ? time : "适当的时间"}问候${name}。`
      }
    }]
  })
);

// 启动服务器的主函数
async function main() {
  console.log("Starting MCP Server...");
  
  // 创建标准输入/输出传输通道
  const transport = new StdioServerTransport();
  
  // 连接服务器到传输通道
  await server.connect(transport);
  
  console.log("MCP Server is running with resources, tools and prompts...");
}

// 启动服务器
main().catch(error => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
});