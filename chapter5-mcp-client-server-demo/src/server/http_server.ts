import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// 创建Express应用
const app = express();
app.use(express.json());

// 存储会话传输
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// 创建MCP服务器实例
function createServer() {
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

  return server;
}

// 处理POST请求
app.post('/mcp', async (req, res) => {
  // 检查现有会话ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // 重用现有传输
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // 新的初始化请求
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // 按会话ID存储传输
        transports[sessionId] = transport;
      }
    });

    // 关闭时清理传输
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    
    const server = createServer();

    // 连接到MCP服务器
    await server.connect(transport);
  } else {
    // 无效请求
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // 处理请求
  await transport.handleRequest(req, res, req.body);
});

// 可重用的GET和DELETE请求处理程序
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// 处理GET请求（用于SSE通知）
app.get('/mcp', handleSessionRequest);

// 处理DELETE请求（用于会话终止）
app.delete('/mcp', handleSessionRequest);

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Server is running on port ${PORT}`);
});