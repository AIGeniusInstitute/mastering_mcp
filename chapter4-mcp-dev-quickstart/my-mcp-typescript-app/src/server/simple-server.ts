import express from "express";
import {randomUUID} from "node:crypto";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {isInitializeRequest} from "@modelcontextprotocol/sdk/types.js";
import {z} from "zod";

const app = express();
app.use(express.json());

// 用于存储按会话 ID 区分的 transport 实例
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// 定义服务器的工具、资源和提示配置逻辑，以便在每个会话中复用
const configureMcpServer = (server: McpServer) => {
    // 定义一个简单的计算器工具
    server.tool(
        "calculator",
        {
            operation: z.enum(["add", "subtract", "multiply", "divide"]),
            a: z.number(),
            b: z.number()
        },
        async ({operation, a, b}) => {
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
                    if (b === 0) throw new Error("除数不能为零");
                    result = a / b;
                    break;
            }
            return {
                content: [{type: "text", text: `计算结果: ${result}`}]
            };
        }
    );


    // Static resource
    server.resource(
        "config",
        "config://app",
        async (uri) => ({
            contents: [{
                uri: uri.href,
                text: "App configuration here"
            }]
        })
    );

    // Dynamic resource with parameters
    server.resource(
        "user-profile",
        new ResourceTemplate("users://{userId}/profile", {list: undefined}),
        async (uri, {userId}) => ({
            contents: [{
                uri: uri.href,
                text: `Profile data for user ${userId}`
            }]
        })
    );

    // 定义一个动态资源
    server.resource(
        "greeting",
        new ResourceTemplate("greeting://{name}", {list: undefined}),
        async (uri, {name}) => ({
            contents: [{
                uri: uri.href,
                text: `你好，${name}！欢迎使用MCP。`
            }]
        })
    );

    // 定义一个提示模板
    server.prompt(
        "code-review",
        {code: z.string()},
        ({code}) => ({
            messages: [{
                role: "user",
                content: {
                    type: "text",
                    text: `请帮我审查以下代码并提供改进建议：\n\n${code}`
                }
            }]
        })
    );
};

// 处理客户端到服务器的 POST 请求
app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        // 复用现有 transport
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // 新的初始化请求
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (newSessionId) => {
                // 按会话 ID 存储 transport
                transports[newSessionId] = transport;
                console.log(`MCP Session initialized: ${newSessionId}`);
            }
        });

        // 当 transport 关闭时进行清理
        transport.onclose = () => {
            if (transport.sessionId && transports[transport.sessionId]) {
                console.log(`MCP Session closed: ${transport.sessionId}`);
                delete transports[transport.sessionId];
            }
        };

        // 为这个会话创建一个新的 McpServer 实例
        const server = new McpServer({
            name: "SimpleMcpServerPerSession", // 可以根据需要调整名称
            version: "1.0.0"
        });

        // 配置此服务器实例的工具、资源和提示
        configureMcpServer(server);

        // 连接到 MCP 服务器
        await server.connect(transport);
    } else {
        // 无效请求
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000, // JSON-RPC error code for server error
                message: 'Bad Request: No valid session ID provided or not an initialization request.',
            },
            id: req.body?.id || null,
        });
        return;
    }

    // 处理请求
    await transport.handleRequest(req, res, req.body);
});

// GET 和 DELETE 请求的复用处理程序
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

// 处理服务器到客户端通知的 GET 请求 (SSE)
app.get('/mcp', handleSessionRequest);

// 处理会话终止的 DELETE 请求
app.delete('/mcp', handleSessionRequest);

const port = 3000;
app.listen(port, () => {
    console.log(`MCP服务器已通过Express和StreamableHTTPServerTransport启动，在 http://localhost:${port}/mcp 上等待连接...`);
});