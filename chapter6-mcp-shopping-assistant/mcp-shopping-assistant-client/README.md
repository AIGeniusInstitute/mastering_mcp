# MCP 客户端示例

这是一个使用 TypeScript 实现的 Claude MCP 客户端示例，用于连接 MCP SSE 服务器并与 AI 助手交互。

## 功能特点

- 使用 MCP SSE 传输连接到 MCP 服务器
- 获取和调用服务器提供的工具
- 与大型语言模型(LLM)进行交互
- 提供命令行和 Web 服务器两种实现方式
- Web 界面支持折叠式工具调用显示和美化结果输出

## 项目结构

```
mcp-client/
├── src/
│   ├── types.ts          # 类型定义
│   ├── config.ts         # 配置文件
│   ├── utils.ts          # 工具函数
│   ├── cli-client.ts     # 命令行客户端
│   └── web-client.ts     # Web 服务器客户端
├── public/
│   ├── index.html        # Web界面HTML
│   ├── styles.css        # 样式表
│   └── script.js         # 前端JavaScript
├── package.json
└── tsconfig.json
```

## 安装与运行

1. 安装依赖

```bash
npm install
```

2. 创建环境配置文件

```bash
cp .env.example .env
```

3. 配置你的 API 密钥和 MCP 服务器地址

在 `.env` 文件中配置如下：

```
MCP_SERVER_URL=http://localhost:8083/sse

# 可选配置，按优先级使用
OPENAI_API_KEY=sk-your-key-here
OPENAI_API_URL=https://api.openai.com/v1

GROQ_API_KEY=gsk-your-key-here
GROQ_API_URL=https://api.groq.com/openai/v1

ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_API_URL=https://api.anthropic.com/v1

# 默认模型
DEFAULT_MODEL=claude-3-5-sonnet-20240620
```

4. 运行命令行客户端

```bash
npm run start
# 或开发模式（监视文件变化）
npm run dev
```

5. 运行 Web 服务器客户端

```bash
npm run start-web
# 或开发模式（监视文件变化）
npm run dev-web
```

## 使用方法

### 命令行客户端

启动命令行客户端后，可以直接在终端输入问题，客户端会处理以下流程：

1. 连接到 MCP 服务器获取可用工具
2. 将问题发送给 AI 模型
3. 如果 AI 决定使用工具，客户端会调用对应的 MCP 工具
4. 将工具结果返回给 AI 获取最终答案
5. 显示结果给用户

输入 `exit` 可以退出程序。

> 注意：在监听模式下可能会出现"Return key Restarting"问题，此时建议使用 Web 客户端或 `npm run start` 运行。

![](https://picdn.youdianzhishi.com/images/1743580511504.png)

### Web 服务器客户端

Web 服务器提供了以下 API 端点：

- `GET /api/tools` - 获取可用工具列表
- `POST /api/chat` - 发送聊天消息并获取回复
- `POST /api/call-tool` - 直接调用 MCP 工具

Web 界面特点：

- 显示所有可用工具及其参数
- 工具调用过程可视化，包括工具名称、参数和结果
- 工具调用结果默认折叠，可点击展开查看详情
- 复杂嵌套 JSON 结果智能格式化，提高可读性

![](https://picdn.youdianzhishi.com/images/1743580945607.png)

## AI 集成

客户端支持多种 AI 模型接口进行交互：

- Anthropic API (Claude 系列模型)
- OpenAI API
- Groq API (与 OpenAI 兼容)

AI 模型负责理解用户问题，决定何时调用 MCP 工具，以及综合工具结果提供最终回答。配置文件中可以设置默认使用的模型。
