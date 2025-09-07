// src/server/http_server.ts
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { ARK_API_URL, ENDPOINT_ID } from "../const/const";

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
                content: [{ type: "text", text: `计算结果: ${a} ${operation} ${b} = ${result}` }]
            };
        }
    );

    // 添加大模型API集成工具
    server.tool(
        "ask-model",
        {
            question: z.string()
        },
        async ({ question }) => {

            try {
                // 调用大模型API
                const response = await fetch(ARK_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.ARK_API_KEY || "your_api_key_here"}`
                    },
                    body: JSON.stringify({
                        model: ENDPOINT_ID,
                        stream: true,  // 启用流式输出
                        messages: [
                            { role: "system", content: "你是人工智能助手." },
                            { role: "user", content: question }
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }

                // 确保response.body不为null
                if (!response.body) {
                    throw new Error("响应体为空");
                }

                // 处理流式响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = "";
                
                // 循环读取并处理流式数据
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const json = JSON.parse(data);
                                if (json.choices && json.choices[0].delta) {
                                    const reasoning_content = json.choices[0].delta.reasoning_content;
                                    if (reasoning_content) {
                                        fullText += reasoning_content;
                                        // 这里可以添加日志来调试
                                        process.stdout.write(reasoning_content)
                                    }
                                    const content = json.choices[0].delta.content;
                                    if (content){
                                        fullText += content;
                                        process.stdout.write(content)
                                    }
                                }
                            } catch (e) {
                                console.error('解析流式响应出错:', e, '原始数据:', data);
                            }
                        }
                    }
                }
                
                console.log(`最终文本: "${fullText}"`);
                
                // 返回完整的响应
                return {
                    content: [{ type: "text", text: fullText }]
                };
                    
            } catch (error) {
                console.error("调用大模型API出错:", error);
                return {
                    content: [{ type: "text", text: `调用大模型API出错: ${error instanceof Error ? error.message : String(error)}` }],
                    isError: true
                };
            }
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
                content: { type: "text", text: `请用${time ? time : "适当的时间"}问候${name}。` }
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