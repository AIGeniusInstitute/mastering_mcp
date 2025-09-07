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

import { formatToolResult } from './utils.js';

import { ENDPOINT_ID } from "./const.js";
import { ARK_API_URL } from "./const.js";


// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// API: 聊天请求
// @ts-ignore
apiRouter.post("/chat", async (req, res) => {
  let localToolResults: any[] = []; // 为当前请求创建局部的 toolResults
  let responseSent = false; // 标记响应是否已发送

  try {
    console.log("收到聊天请求");
    const { message, history = [] } = req.body;
    console.log(`用户消息: ${message}`);
    console.log(`历史消息数量: ${history.length}`);

    if (!message) {
      console.warn("请求中消息为空");
      if (!responseSent) {
        res.status(400).json({ error: "消息不能为空" });
        responseSent = true;
      }
      return;
    }

    const messages: any[] = [...history, { role: "user", content: message }];
    console.log(`准备发送到AI的消息总数: ${messages.length}`);
    console.log(`开始调用AI模型: `);

    // 调用大模型API (第一次调用)
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
        max_tokens: 8192,
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let accumulatedTextFromFirstCall = "";
    let identifiedToolCalls: any[] = [];

    // 处理第一次AI调用的流式响应
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {

        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data === '[DONE]') break;

          try {
            const json = JSON.parse(data);
            if (json.choices && json.choices[0].delta) {
              const delta = json.choices[0].delta;
              if (delta.reasoning_content) {
                accumulatedTextFromFirstCall += delta.reasoning_content;
                process.stdout.write(delta.reasoning_content);
              }
              if (delta.content) {
                accumulatedTextFromFirstCall += delta.content;
                process.stdout.write(delta.content);
              }
              if (delta.tool_calls) {
                // 收集工具调用
                identifiedToolCalls.push(...delta.tool_calls)
              }
            }
          } catch (e) {
            console.error('解析流式响应出错(第一次调用):', e, '原始数据:', data);
          }
        }
      }
    }

    console.log("AI第一次调用结束:", accumulatedTextFromFirstCall);
    console.log("AI第一次调用返回的工具调用:", identifiedToolCalls);

    // 检查是否有工具调用
    if (identifiedToolCalls && identifiedToolCalls.length > 0) {
      for (const tool_call of identifiedToolCalls) {
        // 检查工具调用是否有效
        if (tool_call.function === undefined || tool_call.function.name === undefined) {
          console.warn("无效的工具调用:", "\t", JSON.stringify(tool_call, null, 2));
          continue;
        }

        const toolName = tool_call.function.name;
        const toolInputString = tool_call.function.arguments;

        console.log(`工具名称: ${toolName}`);
        console.log(`工具参数: ${toolInputString}`);

        let toolInput = {};
        try {
          // arguments 可能是一个JSON字符串，需要解析
          if (toolInputString && toolInputString.trim() !== "") {
            toolInput = JSON.parse(toolInputString);
          }
        } catch (parseError) {
          console.error(`解析工具参数失败 for ${toolName}:`, parseError, `参数: ${toolInputString}`);
          continue; // 跳过执行此工具
        }

        console.log(`调用工具: ${toolName}`);
        console.log(`参数: ${JSON.stringify(toolInput, null, 2)}`);

        try {
          if (!mcpClient) {
            throw new Error("MCP客户端未初始化");
          }

          const toolResult = await mcpClient.callTool({
            name: toolName,
            arguments: toolInput
          });

          console.log(`工具结果 (${toolName}): ${JSON.stringify(toolResult, null, 2)}`);

          const formattedResult = formatToolResult(toolResult);
          localToolResults.push({
            tool_call_id: tool_call.id,
            name: toolName,
            result: formattedResult, // 或者原始 toolResult，取决于客户端期望
          });

          messages.push({
            role: "user",
            content: formattedResult, // 或者 JSON.stringify(toolResult)
          });

        } catch (error: any) {
          console.error(`工具调用失败: ${toolName}`, error);
          localToolResults.push({
            tool_call_id: tool_call.id,
            name: toolName,
            error: error.message,
          });
        }
      }

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
          messages: messages, // messages 包含用户、第一次AI回复、所有工具结果
          max_tokens: 8192
        })
      });

      if (!followUpResponse.ok) {
        throw new Error(`API后续请求失败: ${followUpResponse.status} ${followUpResponse.statusText}`);
      }

      const followUpReader = followUpResponse.body!.getReader();
      const followUpDecoder = new TextDecoder();

      // 用于最终AI输出的文本结果
      let finalAiText = "";

      while (true) {
        const { done, value } = await followUpReader.read();
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
                  finalAiText += delta.reasoning_content;
                  process.stdout.write(delta.reasoning_content);
                }
                if (delta.content) {
                  finalAiText += delta.content;
                  process.stdout.write(delta.content);
                }

              }
            } catch (e) {
              console.error('解析流式响应出错 (后续调用):', e, '原始数据:', data);
            }
          }
        }
      }

      // 在所有处理完成后发送最终响应
      if (!responseSent) {
        res.json({
          response: finalAiText,
          toolCalls: localToolResults,
        });
        responseSent = true;
      }
    } else {
      // 没有工具调用，直接发送第一次AI调用的文本结果
      if (!responseSent) {
        res.json({
          response: accumulatedTextFromFirstCall,
          toolCalls: localToolResults, // 将为空数组
        });
        responseSent = true;
      }
    }

  } catch (error: any) {
    console.error("聊天请求处理失败:", error);
    if (!responseSent) {
      res.status(500).json({ error: error.message });
      responseSent = true;
    }
  }
});


apiRouter.post("/chat_sse", async (req, res) => {
  // let localToolResults: any[] = []; // 为当前请求创建局部的 toolResults // Will be sent via stream
  // let responseSent = false; // 标记响应是否已发送 // Handled by res.finished
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

    // 调用大模型API (第一次调用)
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
        max_tokens: 8192,
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    // let accumulatedTextFromFirstCall = ""; // Will be sent via stream
    let identifiedToolCalls: any[] = [];

    // 处理第一次AI调用的流式响应
    while (true) {
      const { done, value } = await reader.read();
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
              if (delta.reasoning_content) {
                // accumulatedTextFromFirstCall += delta.reasoning_content;
                sendStreamData({ type: 'text_delta', content: delta.reasoning_content });
                process.stdout.write(delta.reasoning_content);
              }
              if (delta.content) {
                // accumulatedTextFromFirstCall += delta.content;
                sendStreamData({ type: 'text_delta', content: delta.content });
                process.stdout.write(delta.content);
              }
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                    if (tc.function && tc.function.name) {
                        identifiedToolCalls.push(tc); // Collect for execution
                        sendStreamData({
                            type: 'tool_call_request',
                            data: {
                                id: tc.id,
                                name: tc.function.name,
                                arguments_str: tc.function.arguments // Keep as string for now
                            }
                        });
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

    // console.log("AI第一次调用结束:", accumulatedTextFromFirstCall); // Not accumulated anymore
    console.log("AI第一次调用返回的工具调用:", identifiedToolCalls);

    // 检查是否有工具调用
    if (identifiedToolCalls && identifiedToolCalls.length > 0) {
      sendStreamData({ type: 'thinking_update', content: `AI 准备使用 ${identifiedToolCalls.length} 个工具...` });
      for (const tool_call of identifiedToolCalls) {
        if (tool_call.function === undefined || tool_call.function.name === undefined) {
          console.warn("无效的工具调用:", "\t", JSON.stringify(tool_call, null, 2));
          continue;
        }

        const toolName = tool_call.function.name;
        const toolInputString = tool_call.function.arguments;

        let toolInput = {};
        try {
          if (toolInputString && toolInputString.trim() !== "") {
            toolInput = JSON.parse(toolInputString);
          }
        } catch (parseError) {
          console.error(`解析工具参数失败 for ${toolName}:`, parseError, `参数: ${toolInputString}`);
          const errorResult = {
            tool_call_id: tool_call.id,
            name: toolName,
            args: toolInputString, // Send original args string
            error: `参数解析错误: ${parseError.message}`,
          };
          localToolResultsForClient.push(errorResult);
          sendStreamData({ type: 'tool_call_result', data: errorResult });
          messages.push({ role: "user", content: JSON.stringify({error: `工具 ${toolName} 参数解析失败`}) });
          continue;
        }

        console.log(`调用工具: ${toolName}`);
        console.log(`参数: ${JSON.stringify(toolInput, null, 2)}`);
        sendStreamData({ type: 'thinking_update', content: `正在调用工具: ${toolName}...` });

        try {
          if (!mcpClient) {
            throw new Error("MCP客户端未初始化");
          }

          const toolResult = await mcpClient.callTool({
            name: toolName,
            arguments: toolInput
          });

          console.log(`工具结果 (${toolName}): ${JSON.stringify(toolResult, null, 2)}`);
          const formattedResult = formatToolResult(toolResult);
          const successResult = {
            tool_call_id: tool_call.id,
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
            tool_call_id: tool_call.id,
            name: toolName,
            args: toolInput,
            error: error.message,
          };
          localToolResultsForClient.push(failureResult);
          sendStreamData({ type: 'tool_call_result', data: failureResult });
          messages.push({ role: "user", content: JSON.stringify({error: `工具 ${toolName} 调用失败: ${error.message}`}) });
        }
      }

      // 所有工具调用处理完毕，将结果发送给AI进行最终回复
      sendStreamData({ type: 'final_response_start', content: '工具使用完成，AI 正在生成最终回复...' });
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
          max_tokens: 8192
        })
      });

      if (!followUpResponse.ok) {
        throw new Error(`API后续请求失败: ${followUpResponse.status} ${followUpResponse.statusText}`);
      }

      const followUpReader = followUpResponse.body!.getReader();
      const followUpDecoder = new TextDecoder();
      // let finalAiText = ""; // Will be sent via stream

      while (true) {
        const { done, value } = await followUpReader.read();
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
                  // finalAiText += delta.reasoning_content;
                  sendStreamData({ type: 'text_delta', content: delta.reasoning_content });
                  process.stdout.write(delta.reasoning_content);
                }
                if (delta.content) {
                  // finalAiText += delta.content;
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
      // No explicit final response to send here as it's all streamed
    } else {
      // 没有工具调用，第一次AI调用的文本结果已经通过 stream 发送
      // accumulatedTextFromFirstCall is already streamed
    }

    sendStreamData({ type: 'stream_end' });
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

// 注册API路由
app.use("/api", apiRouter);

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web客户端服务器已启动，地址: http://localhost:${PORT}`);

  // 预初始化MCP客户端
  initMcpClient().catch(console.error);

});
