
# MCP 开发实战 0-1

mcp-in-action

从0到1开发MCP服务器和客户端的完整教程: https://blog.csdn.net/universsky2015/article/details/147932411

Model Context Protocol (MCP) 是一个标准化协议，允许应用程序以标准化的方式为大语言模型(LLM)提供上下文，将提供上下文的关注点与实际的LLM交互分离开来。MCP服务器可以：

通过资源(Resources)暴露数据（类似于REST API中的GET端点）
通过工具(Tools)提供功能（类似于POST端点，用于执行代码或产生副作用）
通过提示(Prompts)定义交互模式（用于LLM交互的可重用模板）
在本教程中，我们将从零开始构建一个MCP服务器，并创建一个客户端来与之交互。


# 环境准备
首先，我们需要创建一个新的Node.js项目并安装必要的依赖。
```shell
# 创建项目目录
mkdir mcp-demo
cd mcp-demo

# 初始化Node.js项目
npm init -y

# 安装MCP SDK和其他依赖
npm install @modelcontextprotocol/sdk zod express
npm install typescript ts-node @types/node @types/express --save-dev

# 初始化TypeScript配置
npx tsc --init
```

编辑tsconfig.json文件，确保包含以下配置：
```json
{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */
    "target": "es2022",                                  
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "skipLibCheck": true ,               
    "forceConsistentCasingInFileNames": true,            
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}

```

创建项目结构：
```shell
mkdir -p src/server src/client
```

编写源代码，见仓库。

# 运行
```shell
./run_stdio_client.sh    
```
输出结果：
```
Starting MCP Client...
Connected to MCP Server

--- 列出所有资源 ---
{
  "resources": [
    {
      "uri": "config://app",
      "name": "config"
    }
  ]
}

--- 读取配置资源 ---
{
  "contents": [
    {
      "uri": "config://app",
      "text": "这是应用程序的配置信息。\n版本: 1.0.0\n环境: development"
    }
  ]
}

--- 读取用户资源 ---
{
  "contents": [
    {
      "uri": "users://123/profile",
      "text": "用户ID: 123\n姓名: 用户123\n注册时间: 2025-05-13T12:36:19.427Z"
    }
  ]
}

--- 列出所有工具 ---
{
  "tools": [
    {
      "name": "calculate",
      "inputSchema": {
        "type": "object",
        "properties": {
          "operation": {
            "type": "string",
            "enum": [
              "add",
              "subtract",
              "multiply",
              "divide"
            ]
          },
          "a": {
            "type": "number"
          },
          "b": {
            "type": "number"
          }
        },
        "required": [
          "operation",
          "a",
          "b"
        ],
        "additionalProperties": false,
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    },
    {
      "name": "get-weather",
      "inputSchema": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string"
          }
        },
        "required": [
          "city"
        ],
        "additionalProperties": false,
        "$schema": "http://json-schema.org/draft-07/schema#"
      }
    }
  ]
}

--- 调用计算工具 ---
{
  "content": [
    {
      "type": "text",
      "text": "计算结果: 5 add 3 = 8"
    }
  ]
}

--- 调用天气工具 ---
{
  "content": [
    {
      "type": "text",
      "text": "北京的天气: 晴天，25°C"
    }
  ]
}

--- 列出所有提示 ---
{
  "prompts": [
    {
      "name": "greet-user",
      "arguments": [
        {
          "name": "name",
          "required": true
        },
        {
          "name": "time",
          "required": false
        }
      ]
    }
  ]
}

--- 获取问候提示 ---
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "请用morning问候张三。"
      }
    }
  ]
}
Connection closed
```