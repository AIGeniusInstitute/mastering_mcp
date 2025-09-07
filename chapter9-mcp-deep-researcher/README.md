# iResearcher



## 功能介绍
### 1. 深度研究报告生成助手
- **功能描述**：
  - 该助手能够根据用户输入的研究主题和深度，生成详细的研究报告。
  - 报告内容包括：
    - 搜索结果
    - 网页内容
    - 学术论文信息
    - 引用来源
  - 支持多种输出格式，如Markdown、HTML等。
- **使用方法**：
  - 用户通过Streamlit界面输入研究主题和深度。
  - 系统会自动调用MCP客户端，连接到MCP服务器以获取工具。
  - 工具包括：
    - `web_search`：执行网络搜索
    - `browse_url`：获取特定URL的详细内容
    - `search_arxiv`：搜索学术论文
  - 收集到的信息会被分析并生成报告。
  - 报告内容会实时显示在Streamlit界面上，用户可以下载报告。



### 系统流程


```mermaid
sequenceDiagram
    participant User
    participant StreamlitUI as Streamlit UI
    participant FastAPI as FastAPI服务器
    participant MCPClient as MCP客户端
    participant MCPServer as MCP服务器
    participant BrowserUse as browser-use
    participant Internet as 互联网资源
    participant ReportGen as 报告生成器

    %% 用户请求流
    User->>StreamlitUI: 输入研究主题、深度和格式
    StreamlitUI->>FastAPI: 发送研究请求
    Note over StreamlitUI,FastAPI: 包含主题、深度和输出格式

    %% 信息收集流
    FastAPI->>MCPClient: 连接并请求工具
    MCPClient->>MCPServer: 获取可用工具
    MCPServer-->>MCPClient: 返回工具列表
    
    %% 使用工具收集信息
    MCPClient->>MCPServer: 调用web_search工具
    MCPServer->>BrowserUse: 执行网络搜索
    BrowserUse->>Internet: 访问搜索引擎
    Internet-->>BrowserUse: 返回搜索结果
    BrowserUse-->>MCPServer: 提取搜索结果
    
    %% 获取详细内容
    MCPClient->>MCPServer: 调用browse_url工具
    MCPServer->>BrowserUse: 访问特定URL
    BrowserUse->>Internet: 获取网页内容
    Internet-->>BrowserUse: 返回网页内容
    BrowserUse-->>MCPServer: 提取网页内容
    
    %% 可能的学术搜索
    MCPClient->>MCPServer: 调用search_arxiv工具
    MCPServer->>Internet: 搜索学术论文
    Internet-->>MCPServer: 返回论文信息
    
    %% 返回收集的信息
    MCPServer-->>MCPClient: 返回所有收集的信息
    MCPClient-->>FastAPI: 返回研究数据

    %% 报告生成流
    FastAPI->>ReportGen: 发送收集的信息
    ReportGen->>ReportGen: 分析数据并生成报告
    
    %% 流式返回报告
    ReportGen-->>FastAPI: 开始流式传输报告内容
    FastAPI-->>StreamlitUI: 流式传输报告内容
    Note over FastAPI,StreamlitUI: 报告内容逐块传输
    
    %% 最终展示
    StreamlitUI-->>User: 实时显示报告内容
    FastAPI-->>StreamlitUI: 传输报告元数据(引用源)
    StreamlitUI-->>User: 显示完整报告和引用源
    
    %% 可选的下载
    User->>StreamlitUI: 点击下载报告
    StreamlitUI-->>User: 提供报告下载
```

这个Mermaid时序图详细展示了深度研究报告生成助手中的数据流动过程，清晰地表示了各组件之间的交互和信息传递顺序。图中描述了三个主要流程：

1. **用户请求流**：
   - 用户通过Streamlit界面输入研究主题、深度和格式
   - Streamlit将请求发送到FastAPI服务器

2. **信息收集流**：
   - FastAPI服务器连接MCP客户端并请求工具
   - MCP客户端从MCP服务器获取工具列表
   - 系统使用多种工具收集信息：
     - `web_search`工具执行网络搜索
     - `browse_url`工具获取特定URL的详细内容
     - `search_arxiv`工具搜索学术论文
   - 收集到的信息返回给FastAPI服务器

3. **报告生成流**：
   - FastAPI服务器将收集的信息发送给报告生成器
   - 报告生成器分析数据并生成报告
   - 报告内容通过流式传输方式返回给Streamlit界面
   - 用户可以实时查看报告生成过程
   - 最后传输报告元数据(如引用源)
   - 用户可以下载完整报告

这个时序图展示了系统各组件之间的精确交互顺序，特别强调了流式传输的实现，使用户能够实时看到报告生成过程，而不必等待整个报告完成。