# SSE 类型的 MCP 服务器

基于 TypeScript 实现的 MCP (模型上下文协议) SSE 服务器，提供智能商城相关功能，用于连接 Claude 等大型语言模型和微服务 API。

## 功能特点

- 使用 SSE (Server-Sent Events) 实现实时数据推送
- 支持多客户端同时连接
- 提供商品查询、库存管理和订单处理的 MCP 工具
- 与 Claude API 无缝集成
- 包含健康检查和心跳机制
- 实现优雅关闭和错误处理

## 项目结构

```
mcp-sse-server/
├── src/
│   ├── types/            # 类型定义
│   ├── services/         # 微服务 API 实现
│   │   ├── products.ts   # 商品服务
│   │   ├── inventory.ts  # 库存服务
│   │   └── orders.ts     # 订单服务
│   ├── mcp-server.ts     # MCP 服务器实现
│   ├── mcp-sse-server.ts # SSE 传输层实现
│   ├── index.ts          # 入口文件
│   └── config.ts         # 配置文件
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

3. 启动开发服务器

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

5. 启动生产服务器

```bash
npm start
```

## API 端点

- **SSE 连接**: `GET /sse`

  - 建立 SSE 连接，获取实时更新

- **消息处理**: `POST /messages`

  - 接收 MCP 客户端消息并处理

- **健康检查**: `GET /health`
  - 获取服务器状态信息

## MCP 工具说明

本服务器实现了一个智能商城系统，提供以下 MCP 工具：

1. **getProducts**: 获取所有产品信息

   - 参数: 无
   - 返回: 产品列表，包含 id、name、price、description 等信息

2. **getInventory**: 获取所有产品的库存信息

   - 参数: 无
   - 返回: 库存信息列表，包含 productId、quantity 等信息

3. **getOrders**: 获取所有订单信息

   - 参数: 无
   - 返回: 订单列表，包含 id、customerName、items、totalAmount 等信息

4. **purchase**: 购买商品
   - 参数:
     - customerName: 客户姓名
     - items: 商品列表，每项包含 productId 和 quantity
   - 返回: 订单信息

## 与 Claude 集成

该服务器专为与 Claude 等大型语言模型集成而设计，使用 MCP 协议实现工具调用。集成步骤：

1. 启动 MCP SSE 服务器
2. 使用 MCP 客户端连接到服务器获取工具列表
3. 将工具信息传递给 Claude API
4. Claude 可以根据用户需求调用相应的工具
5. 客户端处理工具结果并返回给用户

## 生产环境部署

部署到生产环境时，请考虑以下最佳实践：

1. 使用进程管理器如 PM2 管理 Node.js 进程
2. 设置合适的内存限制
3. 配置负载均衡以实现高可用性
4. 启用 HTTPS 以确保通信安全
5. 设置适当的日志级别和监控工具

## 容器化部署

可使用 Docker 进行容器化部署，示例 Dockerfile 如下：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 8083

USER node

CMD ["node", "dist/index.js"]
```

## SSE (Server-Sent Events) 说明

SSE 是一种服务器推送技术，允许服务器向客户端发送事件流。与 WebSocket 不同，SSE 是单向的（只从服务器到客户端），并使用标准 HTTP 协议。

SSE 特性：

- 基于 HTTP，无需特殊协议
- 自动重连机制
- 事件 ID 和自定义事件类型
- 相比 WebSocket 更轻量级

在 MCP 服务器中，SSE 用于：

1. 将工具定义发送给 MCP 客户端
2. 在工具调用完成后发送结果
3. 发送心跳以保持连接活跃

## 示例客户端

我们提供了两种客户端实现：

1. 命令行客户端 (CLI)
2. Web 客户端

相关代码和使用方法请参考 [MCP 客户端示例](../mcp-client/README.md)。

![智能商城 Web 界面](https://picdn.youdianzhishi.com/images/1743580945607.png)
