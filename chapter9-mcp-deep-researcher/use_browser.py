# 导入所有必需的库和模块
import asyncio  # 异步I/O库，是运行 browser-use 和现代网络应用的基石
import os  # 用于与操作系统交互，这里主要用来读取环境变量

from dotenv import load_dotenv  # 从 .env 文件加载环境变量的实用工具
from langchain_openai import ChatOpenAI

# 核心组件：browser-use 的 Agent 和 LangChain 的模型接口
from browser_use import Agent

# 步骤1: 环境配置的初始化
# load_dotenv() 会自动查找当前目录下的 .env 文件，并将其中的键值对加载到系统的环境变量中。
# 这是一个至关重要的最佳实践，它能将敏感信息（如API密钥）与代码本身分离。
load_dotenv()

# 步骤2: 配置并初始化大语言模型 (LLM)
# 这是代理的“大脑”，所有的决策与理解都源于此。
# 我们使用 ChatOpenAI 类，它提供了一个与 OpenAI API 兼容的接口。
llm = ChatOpenAI(
    # model: 指定要使用的具体模型。这里通过 os.environ 读取环境变量'Doubao_Seed_16'，
    # 意味着模型名称是可配置的，而非硬编码在代码中。这极大地提高了灵活性。
    model=os.environ['Doubao_Seed_16'],

    # api_key: 指定访问模型服务的认证密钥。同样从环境变量'OPENAI_API_KEY'中安全地获取。
    api_key=os.environ['OPENAI_API_KEY'],

    # base_url: 指定API服务的根地址。这使得代码不仅能调用官方OpenAI服务，
    # 还能无缝切换到任何兼容的第三方或私有化部署的模型服务（如本例中可能指向的豆包大模型服务）。
    base_url=os.environ['OPENAI_BASE_URL'],
)


# 步骤3: 定义核心的异步任务执行函数
async def main():
    """
    这是我们程序的主入口，一个异步函数，负责设置并运行 browser-use 代理。
    """
    # 步骤3.1: 实例化 Agent
    # 创建一个 Agent 实例，这是整个自动化任务的执行者。
    agent = Agent(
        # task: 用清晰、具体的自然语言向代理下达指令。
        # 任务是：“在 github.com 上搜索模型上下文协议（MCP）”。
        # LLM会理解这个指令，并将其分解为具体的浏览器操作步骤。
        task=f"Search Model Context Protocol (MCP)  on github.com ",

        # llm: 将我们刚刚初始化好的 LLM 实例传递给 Agent。
        # 这个llm实例将作为代理的决策核心。
        llm=llm,
    )

    # 步骤3.2: 启动代理并执行任务
    # await agent.run() 是触发任务执行的命令。由于涉及网络I/O和浏览器交互，
    # 这是一个异步操作，因此必须使用 await 来等待其完成。
    # max_steps=10: 这是一个重要的安全和成本控制参数。它限制了代理在完成任务时
    # 最多可以执行10个步骤（如“打开页面”、“输入文字”、“点击按钮”等）。
    # 这可以有效防止代理因任务理解错误或网页结构复杂而陷入无限循环，从而消耗大量资源。
    await agent.run(max_steps=10)


# 步骤4: 程序的标准入口点
if __name__ == '__main__':
    # asyncio.run(main()) 是Python 3.7+中启动并运行一个异步程序的标准方式。
    # 它会创建一个事件循环，运行我们定义的 main() 函数，并在其结束后关闭循环。
    asyncio.run(main())
