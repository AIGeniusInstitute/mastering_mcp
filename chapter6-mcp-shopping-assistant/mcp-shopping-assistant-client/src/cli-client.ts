import chalk from 'chalk';
import ora from 'ora';
import readlineSync from 'readline-sync';
import { config } from './config.js';
import { formatToolResult } from './utils.js';
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ENDPOINT_ID } from "./const.js";
import { ARK_API_URL } from "./const.js";

async function main() {
  console.log(chalk.cyan('================================================'));
  console.log(chalk.cyan('         欢迎使用智能商城 MCP 客户端           '));
  console.log(chalk.cyan('================================================'));

  // 连接MCP服务器
  const spinner = ora('正在连接到MCP服务器...').start();
  try {
    // 创建MCP客户端
    const mcpClient = new McpClient({
      name: 'mcp-sse-demo',
      version: '1.0.0',
    });

    const transport = new SSEClientTransport(
      new URL(config.mcp.serverUrl)
    );

    await mcpClient.connect(transport);

    // 获取可用工具
    const { tools } = await mcpClient.listTools();
    const toolset = tools.reduce((acc: Record<string, any>, tool: any) => {
      acc[tool.name] = {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {}
      };
      return acc;
    }, {});
    spinner.succeed('已连接到MCP服务器并获取工具列表');
    console.log(chalk.green('工具列表:'), toolset);
    // 转换为对应的 Maas API 工具格式
    // const anthropicTools = tools.map((tool: any) => {
    //   return {
    //     name: tool.name,
    //     description: tool.description,
    //     input_schema: tool.inputSchema,
    //   };
    // });
    const arkTools = tools.map((tool: any) => {
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        }
      };
    });

    // 交互式命令行循环
    while (true) {
      const question = readlineSync.question(chalk.green('请输入您的问题 (输入 "exit" 结束): '), {
        hideEchoBack: false,  // 显示输入内容
      });
      if (question.toLowerCase() === 'exit') {
        break;
      }

      // 调用AI
      const aiSpinner = ora('AI正在思考中...\n').start();

      try {
        // const response = await aiClient.messages.create({
        //   model: config.ai.defaultModel,
        //   messages: [
        //     { role: 'user', content: question }
        //   ],
        //   tools: anthropicTools,
        //   max_tokens: 1000,
        // });

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
            ],
            tools: arkTools,
            max_tokens: 8192,
          })
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        // 获取AI回复
        aiSpinner.succeed('AI回复已就绪');

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

            // console.log(chalk.gray(`原始数据: ${line}`));

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
                  if (content) {
                    fullText += content;
                    process.stdout.write(content)
                  }

                  // 处理工具调用
                  const tool_calls = json.choices[0].delta.tool_calls

                  if (tool_calls) {

                    for (const tool_call of tool_calls) {

                      // 获取工具调用信息
                      const toolName = tool_call.function.name;
                      if (!toolName) {
                        // console.log(chalk.red('工具调用缺少名称'));
                        continue;
                      }

                      // 如果 arguments 是一个空字符串，将其转换为 null
                      const toolInput = tool_call.function.arguments || {};

                      // 处理工具调用
                      console.log(chalk.yellow('\n工具调用:'));
                      console.log(chalk.gray(`工具: ${JSON.stringify(tool_call, null, 2)}`));
                      // 工具调用: 
                      // 工具 tool_call : 
                      // {
                      //   "function": {
                      //     "arguments": "",
                      //     "name": "getProducts"
                      //   },
                      //   "id": "call_7db15c1reo8yov1jfzwgwwls",
                      //   "index": 0,
                      //   "type": "function"
                      // }

                      console.log(chalk.blue(`调用工具: ${toolName}`));
                      console.log(chalk.gray(`参数: ${JSON.stringify(toolInput, null, 2)}`));

                      // 调用MCP工具
                      const toolSpinner = ora(`正在执行 ${toolName}...`).start();
                      try {
                        const toolResult = await mcpClient.callTool({
                          name: toolName,
                          arguments: toolInput
                        });
                        toolSpinner.succeed(`${toolName} 执行完成`);

                        // 格式化并显示结果
                        const formattedResult = formatToolResult(toolResult);

                        console.log(chalk.blue(`工具结果: ${formattedResult}`));

                        // 发送工具结果给AI
                        const followUpResponse = await fetch(ARK_API_URL, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.ARK_API_KEY || "your_api_key_here"}`
                          },
                          body: JSON.stringify({
                            model: ENDPOINT_ID,
                            stream: true,  // 启用流式输出
                            messages: [
                              { role: 'user', content: question },
                              { role: 'user', content: formattedResult }
                            ],
                            max_tokens: 8192,
                          })
                        });

                        // 打印最终回复
                        if (followUpResponse.ok) {
                          const reader = followUpResponse.body.getReader();
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
                                    if (content) {
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
                        }

                      } catch (error: any) {
                        toolSpinner.fail(`${toolName} 执行失败: ${error.message}`);
                      }
                    }

                  }

                }
              } catch (e) {
                console.error('解析流式响应出错:', e, '原始数据:', data);
              }
            }
          }
        }

      } catch (error: any) {
        aiSpinner.fail(`调用AI失败: ${error.message}`);
      }

      console.log('\n' + chalk.cyan('-----------------------------------------------') + '\n');
    }
    console.log(chalk.cyan('感谢使用，再见！'));
    process.exit(0);
  } catch (error: any) {
    spinner.fail(`连接MCP服务器失败: ${error.message}`);
    process.exit(1);
  }
}


main().catch(error => {
  console.error(chalk.red('程序运行出错:'), error);
  process.exit(1);
}); 