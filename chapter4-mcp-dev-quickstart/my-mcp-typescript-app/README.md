
```bash
npm run start_mcp_server                                                             

> my-mcp-app@1.0.0 start_mcp_server
> ts-node ./src/server/simple-server.ts

MCP服务器已通过Express和StreamableHTTPServerTransport启动，在 http://localhost:3000/mcp 上等待连接...
MCP Session initialized: 6667c1c9-8623-4db8-adf3-b3a43b9a0da6
```


----

```bash
npm run start_mcp_client                                                             

> my-mcp-app@1.0.0 start_mcp_client
> ts-node ./src/client/simple-client.ts

已连接到MCP服务器 (或准备好通过HTTP发送请求)
可用资源: { resources: [ { uri: 'config://app', name: 'config' } ] }
可用提示词: {"prompts":[{"name":"code-review","arguments":[{"name":"code","required":true}]}]}
可用工具: {"tools":[{"name":"calculator","inputSchema":{"type":"object","properties":{"operation":{"type":"string","enu"add","subtract","multiply","divide"]},"a":{"type":"number"},"b":{"type":"number"}},"required":["operation","a","b"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}}]}
计算结果: { content: [ { type: 'text', text: '计算结果: 8' } ] }
问候消息: {
  contents: [
    {
      uri: 'greeting://ModelContextProtocol',
      text: '你好，ModelContextProtocol！欢迎使用MCP。'
    }
  ]
}
MCP会话已关闭
```