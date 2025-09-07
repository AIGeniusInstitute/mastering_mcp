/**
 * Web客户端示例
 * 
 * 该示例展示了如何使用MCP客户端和 Maas API构建一个简单的Web聊天应用。
 * 该应用包括以下功能：
 * 1. 从MCP服务器获取可用工具列表。
 * 2. 发送聊天消息给 Maas API。
 * 3. 处理工具调用并返回最终回复。
 * 4. 直接调用MCP工具。
 * 5. 提供一个简单的Web界面，用于发送聊天消息和查看回复。
 * 6. 支持历史消息和工具调用。
 * 7. 支持工具调用结果的格式化。
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { config } from "./config.js";

import { ARK_API_URL, ENDPOINT_ID } from "./const.js";
import { formatToolResult } from "./utils.js";


// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_TOKENS = 16000;
let mcpClient: McpClient | null = null;
let arkTools: any[] = [];

const app = express();

// 使用中间件
app.use(express.json());

console.log("正在启动Web客户端...", __dirname);

app.use(express.static(path.join(__dirname, "../public")));

// 初始化MCP客户端
async function initMcpClient() {
  if (mcpClient) return;

  try {
    console.log("正在连接到MCP服务器...");
    mcpClient = new McpClient({
      name: "mcp-client",
      version: "1.0.0",
    });

    const transport = new SSEClientTransport(new URL(config.mcp.serverUrl));

    await mcpClient.connect(transport);
    const { tools } = await mcpClient.listTools();

    console.log("连接到MCP服务器成功");
    console.log("获取到的工具列表:");
    console.log(tools);

    // 转换工具格式为 Maas API 所需的 Tool 数组形式
    arkTools = tools.map((tool: any) => {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        }
      };
    });
    console.log("MCP客户端和工具已初始化完成");
  } catch (error) {
    console.error("初始化MCP客户端失败:", error);
    throw error;
  }
}

// 主页
app.get("/", (req, res) => {
  console.log("访问主页:", __dirname);
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 创建路由器
const apiRouter = express.Router();

// 中间件：确保MCP客户端已初始化
// @ts-ignore
apiRouter.use((req, res, next) => {
  if (!mcpClient) {
    initMcpClient().catch(console.error);
  }
  next();
});

// API: 获取可用工具列表
// @ts-ignore
apiRouter.get("/tools", async (req, res) => {
  try {
    res.json({ tools: arkTools });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: 直接调用工具
// @ts-ignore
apiRouter.post("/call-tool", async (req, res) => {
  try {
    const { name, args } = req.body;

    if (!name) {
      console.warn("请求中工具名称为空");
      return res.status(400).json({ error: "工具名称不能为空" });
    }

    if (!mcpClient) {
      console.error("MCP客户端未初始化");
      throw new Error("MCP客户端未初始化");
    }

    const result = await mcpClient.callTool({
      name,
      arguments: args || {},
    });
    res.json({ result });
  } catch (error: any) {
    console.error("工具调用请求处理失败:", error);
    res.status(500).json({ error: error.message });
  }
});


// API: 聊天请求
// @ts-ignore
apiRouter.post("/chat_sse", async (req, res) => {
  const localToolResultsForClient: any[] = []; // Store tool results to send to client via stream

  try {
    console.log("收到聊天请求");
    const { message, history = [] } = req.body;
    console.log(`用户消息: ${message}`);
    console.log(`历史消息数量: ${history.length}`);

    if (!message) {
      console.warn("请求中消息为空");
      if (!res.headersSent) {
        res.status(400).json({ error: "消息不能为空" });
      }
      return;
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    const sendStreamData = (data: any) => {
      if (!res.writableEnded) {
        res.write(JSON.stringify(data) + '\n');
      }
    };

    sendStreamData({ type: 'stream_start' });

    const messages: any[] = [...history, { role: "user", content: message }];
    console.log(`准备发送到AI的消息总数: ${messages.length}`);
    sendStreamData({ type: 'thinking_update', content: 'AI正在分析您的问题...' });

    // 1.调用大模型API (第一次调用)
    const response = await fetch(ARK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ARK_API_KEY || "your_api_key_here"}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        stream: true,
        messages: messages,
        tools: arkTools,
        max_tokens: MAX_TOKENS,
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // 处理第一次AI调用的流式响应
    while (true) {
      const { done, value } = await reader.read();
      // 如果done为true，跳出循环
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') continue; // Changed from break to continue to process all lines in chunk

          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0].delta) {
              const delta = json.choices[0].delta;

              // 推理内容
              if (delta.reasoning_content) {
                sendStreamData({ type: 'text_delta', content: delta.reasoning_content });
                process.stdout.write(delta.reasoning_content);
              }

              // 输出正文
              if (delta.content) {
                sendStreamData({ type: 'text_delta', content: delta.content });
                process.stdout.write(delta.content);
              }

              // 检查是否有工具调用
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.function && tc.function.name) {
                    const toolId = tc.id;
                    const toolName = tc.function.name;
                    const toolInputString = tc.function.arguments;
                    // 检查工具是否已注册
                    const registeredTool = arkTools.find(t => t.function.name === toolName);
                    if (!registeredTool) {
                      console.warn(`工具 ${toolName} 未注册`);
                      continue;
                    }

                    // 发送工具调用Stream数据
                    sendStreamData({
                      type: 'tool_call_request',
                      data: {
                        id: toolId,
                        name: toolName,
                        arguments_str: toolInputString // Keep as string for now
                      }
                    });

                    sendStreamData({ type: 'thinking_update', content: `AI 准备使用工具${toolName}...` });

                    let toolInput = {};
                    try {
                      if (toolInputString && toolInputString.trim() !== "") {
                        toolInput = JSON.parse(toolInputString);
                      }
                    } catch (parseError) {
                      console.error(`解析工具参数失败 for ${toolName}:`, parseError, `参数: ${toolInputString}`);
                      const errorResult = {
                        tool_call_id: toolId,
                        name: toolName,
                        args: toolInputString, // Send original args string
                        error: `参数解析错误: ${parseError.message}`,
                      };

                      localToolResultsForClient.push(errorResult);
                      sendStreamData({ type: 'tool_call_result', data: errorResult });
                      messages.push({ role: "user", content: JSON.stringify({ error: `工具 ${toolName} 参数解析失败` }) });

                      continue;
                    }

                    console.log(`调用工具: ${toolName}`);
                    console.log(`参数: ${JSON.stringify(toolInput, null, 2)}`);
                    sendStreamData({ type: 'thinking_update', content: `正在调用工具: ${toolName}...` });

                    try {
                      if (!mcpClient) {
                        throw new Error("MCP客户端未初始化");
                      }

                      // 调用工具
                      const toolResult = await mcpClient.callTool({
                        name: toolName,
                        arguments: toolInput
                      });

                      console.log(`工具结果 (${toolName}): ${JSON.stringify(toolResult, null, 2)}`);
                      const formattedResult = formatToolResult(toolResult);
                      const successResult = {
                        tool_call_id: toolId,
                        name: toolName,
                        args: toolInput, // Send parsed args
                        result: formattedResult,
                      };

                      localToolResultsForClient.push(successResult);
                      sendStreamData({ type: 'tool_call_result', data: successResult });
                      messages.push({ role: "user", content: formattedResult });

                    } catch (error: any) {
                      console.error(`工具调用失败: ${toolName}`, error);
                      const failureResult = {
                        tool_call_id: toolId,
                        name: toolName,
                        args: toolInput,
                        error: error.message,
                      };

                      localToolResultsForClient.push(failureResult);
                      sendStreamData({ type: 'tool_call_result', data: failureResult });
                      messages.push({ role: "user", content: JSON.stringify({ error: `工具 ${toolName} 调用失败: ${error.message}` }) });
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error('解析流式响应出错(第一次调用):', e, '原始数据:', data);
          }
        }
      }
    }

    // 2.调用大模型API (第二次调用)
    sendStreamData({ type: 'final_response_start', content: '工具使用完成，AI 正在生成最终回复...' });
    // 所有工具调用处理完毕，将结果发送给AI进行最终回复
    const followUpResponse = await fetch(ARK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ARK_API_KEY || "your_api_key_here"}`
      },
      body: JSON.stringify({
        model: ENDPOINT_ID,
        stream: true,
        messages: messages,
        tools: arkTools,
        max_tokens: MAX_TOKENS,
      })
    });

    if (!followUpResponse.ok) {
      console.warn(`API后续请求失败: ${followUpResponse.status} ${followUpResponse.statusText}`);
      return;
    }

    const followUpReader = followUpResponse.body!.getReader();
    const followUpDecoder = new TextDecoder();

    while (true) {
      // 处理后续AI调用的流式响应
      const { done, value } = await followUpReader.read();
      // 如果done为true，跳出循环
      if (done) break;

      const chunk = followUpDecoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0].delta) {
              const delta = json.choices[0].delta;
              if (delta.reasoning_content) {
                sendStreamData({ type: 'text_delta', content: delta.reasoning_content });
                process.stdout.write(delta.reasoning_content);
              }
              if (delta.content) {
                sendStreamData({ type: 'text_delta', content: delta.content });
                process.stdout.write(delta.content);
              }
            }
          } catch (e) {
            console.error('解析流式响应出错 (后续调用):', e, '原始数据:', data);
          }
        }
      }
    }

    // 发送最终响应
    sendStreamData({ type: 'stream_end' });

    // 确保响应已发送
    if (!res.writableEnded) {
      res.end();
    }

  } catch (error: any) {

    console.error("聊天请求处理失败:", error);
    const errorData = { type: 'error', message: error.message };
    if (!res.headersSent) {
      // If headers not sent, we can still send a proper JSON error
      res.status(500).json({ error: error.message });
    } else if (!res.writableEnded) {
      // If headers sent, try to write error to stream and end
      res.write(JSON.stringify(errorData) + '\n');
      res.write(JSON.stringify({ type: 'stream_end' }) + '\n');
      res.end();
    }
  }
});


// 注册API路由
app.use("/api", apiRouter);

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web客户端服务器已启动，地址: http://localhost:${PORT}`);

  // 预初始化MCP客户端
  initMcpClient().catch(console.error);

});
