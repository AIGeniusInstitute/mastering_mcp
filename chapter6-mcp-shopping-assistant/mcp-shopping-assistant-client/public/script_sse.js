// DOM 元素获取
const chatMessages = document.getElementById('chat-messages'); // 聊天消息显示区域的容器
const userInput = document.getElementById('user-input'); // 用户输入文本框
const sendButton = document.getElementById('send-button'); // 发送按钮
const toolsList = document.getElementById('tools-list'); // 可用工具列表显示区域

// 消息历史记录数组，用于存储对话上下文
let messageHistory = [];

// 聊天记录自动滚动到底部函数
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight; // 将滚动条位置设置为容器可滚动高度
}

// 添加消息到聊天窗口的函数
// content: 消息内容 (字符串)
// isUser: 布尔值，true表示用户消息，false表示机器人消息 (默认为false)
function addMessage(content, isUser = false) {
    // 在控制台记录添加消息的动作和内容，便于调试
    console.log('Adding message:', {
        content: content,
        isUser: isUser
    });

    const messageDiv = document.createElement('div'); // 创建新的消息容器 div
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`; // 根据消息来源设置CSS类名

    const messageContent = document.createElement('div'); // 创建消息内容显示的 div
    messageContent.className = 'message-content'; // 设置CSS类名
    // 如果是用户消息，使用 formatMessage (Markdown解析) 处理内容；否则直接使用原始内容 (机器人消息的流式内容后续处理)
    messageContent.innerHTML = isUser ? formatMessage(content) : content;

    messageDiv.appendChild(messageContent); // 将消息内容添加到消息容器
    chatMessages.appendChild(messageDiv); // 将消息容器添加到聊天消息显示区域

    // 记录历史消息
    // 用户消息或机器人消息的初始空占位符会被添加到历史记录
    // 机器人消息的完整内容将在 stream_end 事件中更新历史记录
    if (isUser || !content) { 
        messageHistory.push({
            role: isUser ? 'user' : 'assistant', // 'user' 或 'assistant' (机器人)
            content: content // 存储原始文本内容
        });
    }
    
    scrollToBottom(); // 滚动到底部
    return messageContent; // 返回消息内容元素，用于流式更新
}

// 添加系统消息到聊天窗口 (例如 "AI正在思考...")
// text: 系统消息文本
function addSystemMessage(text) {
    const systemDiv = document.createElement('div'); // 创建系统消息容器
    systemDiv.className = 'message system'; // 设置CSS类名
    systemDiv.textContent = text; // 设置文本内容
    chatMessages.appendChild(systemDiv); // 添加到聊天窗口
    scrollToBottom(); // 滚动到底部
    return systemDiv; // 返回系统消息元素
}


// 添加"AI思考中"的提示动画
function addThinkingIndicator() {
    const thinkingDiv = document.createElement('div'); // 创建提示容器
    thinkingDiv.className = 'thinking'; // 设置CSS类名
    thinkingDiv.innerHTML = 'AI思考中<span class="dots">...</span>'; // 设置提示内容和动画点
    chatMessages.appendChild(thinkingDiv); // 添加到聊天窗口
    scrollToBottom(); // 滚动到底部
    return thinkingDiv; // 返回提示元素，以便后续移除
}

// 添加工具调用信息到聊天窗口
// toolCall: 包含工具调用详情的对象 (name, args, result/error)
function addToolCallMessage(toolCall) {
    const toolDiv = document.createElement('div'); // 创建工具调用消息的整体容器
    toolDiv.className = 'message tool-call'; // 设置CSS类名

    // 创建可折叠的标题部分
    const toolHeader = document.createElement('div');
    toolHeader.className = 'tool-call-header collapsible'; // 设置CSS类名，collapsible用于标识可折叠

    // 根据工具调用结果添加成功 (✅) 或失败 (❌) 的状态图标
    const statusIcon = toolCall.error ? '❌' : '✅';
    toolHeader.innerHTML = `<span class="tool-icon">🔧</span> <b>工具调用:</b> ${toolCall.name} <span class="status-icon">${statusIcon}</span> <span class="collapse-icon">▶</span>`; // 设置标题内容，包括工具图标、名称、状态图标和折叠指示图标

    // 创建内容容器 (默认隐藏，实现折叠效果)
    const toolContent = document.createElement('div');
    toolContent.className = 'tool-call-content';
    toolContent.style.display = 'none'; // 默认折叠，不显示内容

    // 添加参数信息部分
    const toolInput = document.createElement('div');
    toolInput.className = 'tool-call-input';
    if (toolCall.args) { // 如果有参数
        toolInput.innerHTML = `<b>参数:</b> <pre>${formatJSON(toolCall.args)}</pre>`; // 使用 formatJSON 美化参数显示
    } else { // 如果无参数
        toolInput.innerHTML = `<b>参数:</b> <pre>{}</pre>`;
    }
    toolContent.appendChild(toolInput); // 将参数信息添加到内容容器

    // 添加结果信息部分
    const toolResult = document.createElement('div');
    toolResult.className = 'tool-call-result';

    if (toolCall.error) { // 如果工具调用出错
        toolResult.innerHTML = `<b>错误:</b> <span class="error">${toolCall.error}</span>`; // 显示错误信息
    } else { // 如果工具调用成功
        // 尝试解析并格式化结果
        try {
            let formattedResult = '';
            const result = toolCall.result; // 获取原始结果

            // 检查结果中是否有 content 字段且为数组 (特定格式，例如包含文本和其他类型)
            if (result && result.content && Array.isArray(result.content)) {
                // 提取类型为 'text' 的内容项
                const textItems = result.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text);

                if (textItems.length > 0) { // 如果提取到文本内容
                    try {
                        // 尝试将第一个文本项解析为JSON
                        const parsedData = JSON.parse(textItems[0]);
                        formattedResult = formatParsedResult(parsedData); // 使用 formatParsedResult 进行结构化显示
                    } catch (e) {
                        // 如果不是有效的JSON，直接将所有文本项用换行连接显示
                        formattedResult = textItems.join('<br>');
                    }
                } else {
                    // 如果没有 'text' 类型的 content，则将整个 result 对象格式化为JSON显示
                    formattedResult = formatJSON(result);
                }
            } else {
                // 如果结果不是上述特定格式，则将整个 result 对象格式化为JSON显示
                formattedResult = formatJSON(result);
            }

            toolResult.innerHTML = `<b>结果:</b> <div class="formatted-result">${formattedResult}</div>`; // 显示格式化后的结果
        } catch (e) {
            // 如果在格式化过程中发生任何错误，则将原始结果（或空对象）格式化为JSON显示，作为回退
            toolResult.innerHTML = `<b>结果:</b> <pre>${formatJSON(toolCall.result || {})}</pre>`;
        }
    }
    toolContent.appendChild(toolResult); // 将结果信息添加到内容容器

    toolDiv.appendChild(toolHeader); // 将标题添加到工具调用消息容器
    toolDiv.appendChild(toolContent); // 将内容添加到工具调用消息容器
    chatMessages.appendChild(toolDiv); // 将整个工具调用消息添加到聊天窗口

    // 添加折叠/展开功能到标题
    toolHeader.addEventListener('click', () => {
        toolHeader.classList.toggle('collapsed'); // 切换 'collapsed' 类名
        const icon = toolHeader.querySelector('.collapse-icon'); // 获取折叠指示图标
        if (toolContent.style.display === 'none') { // 如果当前是折叠状态
            toolContent.style.display = 'block'; // 展开内容
            icon.textContent = '▼'; // 更新图标为向下箭头
        } else { // 如果当前是展开状态
            toolContent.style.display = 'none'; // 折叠内容
            icon.textContent = '▶'; // 更新图标为向右箭头
        }
    });

    // 默认添加折叠状态的类名
    toolHeader.classList.add('collapsed');

    scrollToBottom(); // 滚动到底部
    return toolDiv; // 返回工具调用消息元素
}

// 格式化JSON对象为HTML字符串，带语法高亮效果
// obj: 需要格式化的JSON对象
function formatJSON(obj) {
    // 先将对象转为格式化的JSON字符串 (null, 2 表示使用null作为替换函数，2个空格作为缩进)
    return JSON.stringify(obj, null, 2)
        .replace(/&/g, '&amp;') // HTML转义：& -> &amp;
        .replace(/</g, '&lt;')  // HTML转义：< -> &lt;
        .replace(/>/g, '&gt;')  // HTML转义：> -> &gt;
        // 使用正则表达式匹配JSON中的不同部分 (字符串、数字、布尔值、null、键名) 并添加span标签和对应的CSS类以实现高亮
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number'; // 默认为数字的CSS类
            if (/^"/.test(match)) { // 如果匹配项以双引号开头，则为字符串或键名
                if (/:$/.test(match)) { // 如果以冒号结尾，则为键名
                    cls = 'json-key';
                    match = match.replace(/:$/, ''); // 移除末尾的冒号，因为它不属于键名本身
                } else { // 否则为字符串值
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) { // 如果是布尔值
                cls = 'json-boolean';
            } else if (/null/.test(match)) { // 如果是null
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>'; // 返回带span标签的匹配项
        })
        .replace(/\n/g, '<br>') // 将换行符替换为<br>标签
        .replace(/\s{2}/g, '&nbsp;&nbsp;'); // 将两个空格替换为两个&nbsp;以保留缩进
}

// 格式化从工具结果中解析出的数据 (通常是JSON对象或数组) 为更友好的HTML结构
// data: 解析后的数据
function formatParsedResult(data) {
    // 处理数组类型的数据
    if (Array.isArray(data)) {
        if (data.length === 0) return '<div class="empty-result">[]</div>'; // 空数组的显示

        // 将数组的每个元素映射为一个HTML结构
        return `<div class="result-array">
            ${data.map((item, index) => `
                <div class="result-item">
                    <div class="result-item-header">${index + 1}</div> 
                    <div class="result-item-content">
                        ${typeof item === 'object' && item !== null // 如果数组元素是对象
                ? Object.entries(item).map(([key, value]) => `
                                <div class="result-property">
                                    <strong>${key}:</strong> 
                                    ${formatPropertyValue(value)} 
                                </div>`).join('') // 递归格式化对象的每个属性
                : item} 
                    </div>
                </div>
            `).join('')}
        </div>`;
    }
    // 处理对象类型的数据
    else if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data); // 获取对象的键值对数组
        if (entries.length === 0) return '<div class="empty-result">{}</div>'; // 空对象的显示

        // 将对象的每个属性映射为一个HTML结构
        return `<div class="result-object">
            ${entries.map(([key, value]) => `
                <div class="result-property">
                    <strong>${key}:</strong> 
                    ${formatPropertyValue(value)} 
                </div>
            `).join('')}
        </div>`;
    }
    // 处理原始值 (字符串、数字、布尔等)
    else {
        return String(data); // 直接转为字符串显示
    }
}

// 格式化属性值，用于 formatParsedResult 内部，特别处理嵌套的对象和数组，使其可展开/折叠
// value: 属性的值
function formatPropertyValue(value) {
    if (typeof value === 'object' && value !== null) { // 如果值是对象或数组
        if (Array.isArray(value)) { // 如果是数组
            if (value.length === 0) return '[]'; // 空数组
            // 如果数组较短且元素都是简单类型，直接显示内容
            if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
                return `[${value.join(', ')}]`;
            }
            // 否则，显示为可展开的摘要，点击后显示完整JSON
            return `<span class="expandable-value" onclick="this.classList.toggle('expanded')">
                [数组: ${value.length}项] <span class="preview-content">${formatJSON(value)}</span>
            </span>`;
        } else { // 如果是对象
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}'; // 空对象
            // 如果对象属性较少且值都是简单类型，直接显示内容
            if (keys.length <= 2 && keys.every(k => typeof value[k] !== 'object')) {
                return `{${keys.map(k => `${k}: ${value[k]}`).join(', ')}}`;
            }
            // 否则，显示为可展开的摘要，点击后显示完整JSON
            return `<span class="expandable-value" onclick="this.classList.toggle('expanded')">
                {对象: ${keys.length}个属性} <span class="preview-content">${formatJSON(value)}</span>
            </span>`;
        }
    }
    return String(value); // 如果是原始值，直接转为字符串
}

// 格式化消息内容，主要用于将Markdown文本转换为HTML
// text: 原始消息文本 (Markdown格式)
function formatMessage(text) {
    console.log('Formatting message:', text); // 控制台记录，便于调试
    // 使用 Marked.js 库的 marked.parse() 方法将Markdown解析为HTML
    return marked.parse(text); 
}

// 异步函数：从后端API加载所有可用的工具信息
async function loadTools() {
    try {
        const response = await fetch('/api/tools'); // 发起GET请求到 /api/tools
        const data = await response.json(); // 解析响应体为JSON

        toolsList.innerHTML = ''; // 清空工具列表区域的现有内容 (例如 "加载中..." 提示)

        // 检查响应数据中是否有工具列表且列表不为空
        if (data.tools && data.tools.length > 0) {
            // 遍历工具列表
            data.tools.forEach(tool => {
                // 从工具定义中提取名称、描述和参数信息
                const tName = tool.function.name;
                const tDescription = tool.function.description || '无描述';
                const tParameters = tool.function.parameters;

                const toolDiv = document.createElement('div'); // 创建单个工具的容器
                toolDiv.className = 'tool-item';

                const toolName = document.createElement('div'); // 工具名称元素
                toolName.className = 'tool-name';
                toolName.textContent = tName;

                const toolDescription = document.createElement('div'); // 工具描述元素
                toolDescription.className = 'tool-description';
                toolDescription.textContent = tDescription;

                toolDiv.appendChild(toolName);
                toolDiv.appendChild(toolDescription);

                // 如果工具定义了参数 (tParameters.properties 存在)
                if (tParameters && tParameters.properties) {
                    const paramsDiv = document.createElement('div'); // 参数信息容器
                    paramsDiv.className = 'tool-params';

                    // 遍历参数属性
                    Object.entries(tParameters.properties).forEach(([paramName, paramInfo]) => {
                        const paramDiv = document.createElement('div'); // 单个参数的容器

                        // 显示基本参数描述
                        if (paramInfo.description) {
                            paramDiv.innerHTML = `<span class="param-name">${paramName}</span>: ${paramInfo.description}`;
                            paramsDiv.appendChild(paramDiv);
                        }

                        // 特殊处理数组类型的参数，如果其items也定义了properties (表示数组元素是对象)
                        if (paramInfo.type === 'array' && paramInfo.items && paramInfo.items.properties) {
                            const nestedParamsDiv = document.createElement('div'); // 嵌套参数容器
                            nestedParamsDiv.className = 'nested-params';

                            // 遍历数组元素对象的属性
                            Object.entries(paramInfo.items.properties).forEach(([nestedName, nestedInfo]) => {
                                const nestedParamDiv = document.createElement('div');
                                nestedParamDiv.className = 'nested-param';
                                nestedParamDiv.innerHTML = `<span class="param-name">${paramName}.${nestedName}</span>: ${nestedInfo.description || nestedName}`; // 显示嵌套参数名和描述
                                nestedParamsDiv.appendChild(nestedParamDiv);
                            });
                            paramsDiv.appendChild(nestedParamsDiv); // 将嵌套参数添加到主参数容器
                        }
                    });
                    toolDiv.appendChild(paramsDiv); // 将参数信息添加到工具项
                }
                toolsList.appendChild(toolDiv); // 将工具项添加到工具列表显示区域
            });
        } else {
            toolsList.innerHTML = '<div class="loading">没有可用的工具</div>'; // 如果没有工具，显示提示
        }
    } catch (error) {
        console.error('加载工具失败:', error); // 控制台记录错误
        toolsList.innerHTML = '<div class="loading error">加载工具失败</div>'; // 显示加载失败提示
    }
}


// 异步函数：发送消息到服务器并处理SSE (Server-Sent Events) 流式响应
// message: 用户输入的消息文本
async function sendMessage(message) {
    let thinkingIndicator = null; // "AI思考中"提示元素的引用
    let currentBotMessageContentDiv = null; // 当前机器人消息内容div的引用，用于流式更新
    let accumulatedRawText = ""; // 用于累积机器人回复的原始文本 (在Markdown解析前)

    try {
        // 1. 显示用户发送的消息
        addMessage(message, true);
        userInput.value = ''; // 发送后清空输入框

        // 2. 显示"AI思考中"指示器
        thinkingIndicator = addThinkingIndicator();

        // 3. 发送请求到后端 /api/chat_sse
        const response = await fetch('/api/chat_sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message, // 当前用户消息
                history: messageHistory.slice(0, -1) // 发送除当前用户消息外的历史记录作为上下文
            })
        });

        // 检查HTTP响应状态
        if (!response.ok) {
            // 尝试解析错误响应体，如果失败则使用状态文本
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            addMessage(`请求出错: ${errorData.error || response.statusText || '未知错误'}`); // 显示错误消息
            if (thinkingIndicator) thinkingIndicator.remove(); // 移除思考中提示
            return; // 提前退出
        }
        
        // 4. 处理SSE流
        const reader = response.body.getReader(); // 获取响应体的 ReadableStream 读取器
        const decoder = new TextDecoder(); // 用于将 Uint8Array 解码为字符串
        let buffer = ''; // 用于暂存未完整接收的行数据

        // 循环读取流数据
        while (true) {
            const { done, value } = await reader.read(); // 读取一块数据
            if (done) { // 如果流结束
                if (buffer.trim()) { // 处理缓冲区中可能剩余的最后一行数据
                    handleStreamEvent(JSON.parse(buffer.trim()));
                }
                break; // 退出循环
            }

            buffer += decoder.decode(value, { stream: true }); // 解码数据块并追加到缓冲区
            const lines = buffer.split('\n'); // 按换行符分割数据，SSE事件通常以换行结束
            buffer = lines.pop(); // 最后一行可能不完整，放回缓冲区等待下次读取

            // 处理每一行完整的事件数据
            for (const line of lines) {
                if (line.trim() === '') continue; // 跳过空行
                try {
                    const eventData = JSON.parse(line.trim()); // 解析JSON格式的事件数据
                    handleStreamEvent(eventData); // 调用事件处理函数
                } catch (e) {
                    console.error('Error parsing stream line:', e, 'Line:', line); // 解析失败则记录错误
                }
            }
        }

    } catch (error) { // 捕获fetch或流处理过程中的其他错误
        console.error('发送消息出错:', error);
        if (thinkingIndicator) thinkingIndicator.remove(); // 移除思考中提示
        addMessage(`发送消息出错: ${error.message}`); // 显示错误消息
    }

    // 内部函数：处理不同类型的SSE事件
    function handleStreamEvent(eventData) {
        switch (eventData.type) {
            case 'stream_start': // AI开始回复流
                if (thinkingIndicator) thinkingIndicator.remove(); // 移除"思考中"提示
                // 添加一个空的机器人消息div，用于后续填充流式内容
                currentBotMessageContentDiv = addMessage("", false);
                if (currentBotMessageContentDiv) {
                    // 初始化一个取消标志，用于在stream_end时停止打字机效果
                    currentBotMessageContentDiv._typingCancelled = false; 
                }
                break;
            case 'text_delta': // 收到文本增量
                if (currentBotMessageContentDiv && eventData.content) {
                    accumulatedRawText += eventData.content; // 累积原始文本
                    // 调用打字机效果函数，将增量文本逐字添加到消息div
                    typeCharacterByCharacter(currentBotMessageContentDiv, eventData.content);
                    scrollToBottom(); // 确保新内容可见
                }
                break;
            case 'tool_call_request': // AI请求调用工具
                addSystemMessage(`AI 正在尝试使用工具: ${eventData.data.name}`); // 显示系统提示
                break;
            case 'tool_call_result': // 工具调用完成，收到结果
                let args = eventData.data.args;
                // 工具参数可能是字符串形式的JSON，尝试解析
                if (typeof args === 'string') {
                    try {
                        args = JSON.parse(args || '{}'); // 如果为空字符串则解析为{}
                    } catch (e) {
                        console.warn("Could not parse tool args string for display:", args);
                    }
                }
                // 调用 addToolCallMessage 显示工具调用的详细信息
                addToolCallMessage({ ...eventData.data, args: args });
                break;
            case 'thinking_update': // AI思考状态更新 (例如中间思考过程的文本)
            case 'final_response_start': // 最终回复开始 (目前和thinking_update处理方式相同)
                addSystemMessage(eventData.content); // 显示系统消息
                break;
            case 'stream_end': // AI回复流结束
                if (currentBotMessageContentDiv) {
                    // 设置取消标志为true，通知所有进行中的打字机效果停止
                    currentBotMessageContentDiv._typingCancelled = true;

                    // 使用Marked.js将累积的完整原始文本解析为HTML，并更新机器人消息div的内容
                    currentBotMessageContentDiv.innerHTML = formatMessage(accumulatedRawText);
                    
                    // 更新消息历史记录中对应的机器人消息条目 (之前是空占位符)
                    if (messageHistory.length > 0) {
                        const lastMsg = messageHistory[messageHistory.length - 1];
                        // 确保更新的是最后一条由stream_start创建的助手消息
                        if (lastMsg.role === 'assistant' && lastMsg.content === "") {
                            lastMsg.content = accumulatedRawText; // 用完整的原始文本更新
                        }
                    }
                }
                accumulatedRawText = ""; // 重置累积文本，为下一条消息做准备
                currentBotMessageContentDiv = null; // 重置当前机器人消息div的引用
                break;
            case 'error': // 收到服务器错误事件
                addMessage(`服务器错误: ${eventData.message}`); // 显示错误消息
                if (thinkingIndicator) thinkingIndicator.remove(); // 移除思考中提示
                break;
            default: // 未知类型的事件
                console.warn('Unknown stream event type:', eventData.type);
        }
    }
}


// 打字机效果的Promise队列，确保字符按顺序、逐个显示
let typingQueue = Promise.resolve();

// 实现字符逐个显示的打字机效果函数
// element: 要在其中显示文本的HTML元素
// textChunk: 要显示的文本块
// speed: 打字速度 (毫秒/字符，默认为10ms)
function typeCharacterByCharacter(element, textChunk, speed = 10) {
    const elementForThisTask = element; // 捕获当前任务对应的元素实例，避免闭包问题

    // 将新的打字任务添加到Promise队列末尾
    typingQueue = typingQueue.then(async () => {
        // 关键检查：如果此元素的打字任务已被取消 (例如stream_end已发生)，则中止
        if (elementForThisTask._typingCancelled) {
            return;
        }

        // 逐个字符追加到元素
        for (let i = 0; i < textChunk.length; i++) {
            // 在循环内部再次检查取消标志，以便在处理长文本块中途也能中止
            if (elementForThisTask._typingCancelled) {
                return;
            }
            elementForThisTask.innerHTML += textChunk.charAt(i); // 追加原始字符 (未Markdown解析)
            scrollToBottom(); // 滚动到底部
            await new Promise(resolve => setTimeout(resolve, speed)); // 等待指定时间，模拟打字延迟
        }
    }).catch(err => {
        // 捕获队列中单个任务的错误，防止整个Promise链断裂
        console.error("Error in typing animation promise chain:", err);
    });
}


// 处理发送按钮点击和Enter键按下的函数
function handleSend() {
    const message = userInput.value.trim(); // 获取用户输入的文本并去除首尾空格
    if (message) { // 如果消息不为空
        // userInput.value = ''; // 清空输入框的操作移至 sendMessage 内部，在用户消息添加到UI后执行
        sendMessage(message); // 调用 sendMessage 发送消息
    }
}

// 绑定事件监听器
sendButton.addEventListener('click', handleSend); // 发送按钮的点击事件

userInput.addEventListener('keydown', (e) => { // 用户输入框的键盘按下事件
    if (e.key === 'Enter' && !e.shiftKey) { // 如果按下的是Enter键且没有同时按Shift键
        e.preventDefault(); // 阻止Enter键的默认行为 (例如换行)
        handleSend(); // 调用发送处理函数
    }
});

// 页面加载完成后，自动加载可用工具列表
loadTools();