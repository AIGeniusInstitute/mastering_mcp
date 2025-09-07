// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const toolsList = document.getElementById('tools-list');

// 消息历史
let messageHistory = [];

// 聊天记录自动滚动
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加消息到聊天窗口
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    // Initial content is set directly, formatMessage will be applied at the end for streaming messages
    messageContent.innerHTML = isUser ? formatMessage(content) : content;


    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);

    // 记录历史消息
    if (isUser || !content) { // For bot messages, history is updated at stream_end
        messageHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: content // For bot, this will be raw content, updated later
        });
    }
    

    scrollToBottom();
    return messageContent; // Return the content div for streaming updates
}

// 添加系统消息 (例如 "AI正在思考...")
function addSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message system';
    systemDiv.textContent = text;
    chatMessages.appendChild(systemDiv);
    scrollToBottom();
    return systemDiv;
}


// 添加"AI思考中"提示
function addThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'thinking';
    thinkingDiv.innerHTML = 'AI思考中<span class="dots">...</span>';
    chatMessages.appendChild(thinkingDiv);
    scrollToBottom();

    return thinkingDiv;
}

// 添加工具调用信息到聊天窗口
function addToolCallMessage(toolCall) {
    const toolDiv = document.createElement('div');
    toolDiv.className = 'message tool-call';

    // 创建可折叠的标题
    const toolHeader = document.createElement('div');
    toolHeader.className = 'tool-call-header collapsible';

    // 根据工具调用结果添加成功/失败标识
    const statusIcon = toolCall.error ? '❌' : '✅';
    toolHeader.innerHTML = `<span class="tool-icon">🔧</span> <b>工具调用:</b> ${toolCall.name} <span class="status-icon">${statusIcon}</span> <span class="collapse-icon">▶</span>`;

    // 创建内容容器 (默认隐藏)
    const toolContent = document.createElement('div');
    toolContent.className = 'tool-call-content';
    toolContent.style.display = 'none'; // 默认折叠

    // 添加参数信息
    const toolInput = document.createElement('div');
    toolInput.className = 'tool-call-input';
    if (toolCall.args) {
        toolInput.innerHTML = `<b>参数:</b> <pre>${formatJSON(toolCall.args)}</pre>`;
    } else {
        toolInput.innerHTML = `<b>参数:</b> <pre>{}</pre>`;
    }
    toolContent.appendChild(toolInput);

    // 添加结果信息
    const toolResult = document.createElement('div');
    toolResult.className = 'tool-call-result';

    if (toolCall.error) {
        toolResult.innerHTML = `<b>错误:</b> <span class="error">${toolCall.error}</span>`;
    } else {
        // 尝试解析并格式化结果
        try {
            let formattedResult = '';
            const result = toolCall.result;

            // 检查是否有content字段
            if (result && result.content && Array.isArray(result.content)) {
                // 提取text内容
                const textItems = result.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text);

                if (textItems.length > 0) {
                    try {
                        // 尝试解析text内容中的JSON
                        const parsedData = JSON.parse(textItems[0]);
                        formattedResult = formatParsedResult(parsedData);
                    } catch (e) {
                        // 如果不是有效的JSON，直接显示文本
                        formattedResult = textItems.join('<br>');
                    }
                } else {
                    formattedResult = formatJSON(result);
                }
            } else {
                formattedResult = formatJSON(result);
            }

            toolResult.innerHTML = `<b>结果:</b> <div class="formatted-result">${formattedResult}</div>`;
        } catch (e) {
            toolResult.innerHTML = `<b>结果:</b> <pre>${formatJSON(toolCall.result || {})}</pre>`;
        }
    }
    toolContent.appendChild(toolResult);

    toolDiv.appendChild(toolHeader);
    toolDiv.appendChild(toolContent);
    chatMessages.appendChild(toolDiv);

    // 添加折叠功能
    toolHeader.addEventListener('click', () => {
        toolHeader.classList.toggle('collapsed');
        const icon = toolHeader.querySelector('.collapse-icon');
        if (toolContent.style.display === 'none') {
            toolContent.style.display = 'block';
            icon.textContent = '▼';
        } else {
            toolContent.style.display = 'none';
            icon.textContent = '▶';
        }
    });

    // 默认添加折叠状态
    toolHeader.classList.add('collapsed');

    scrollToBottom();
    return toolDiv;
}

// 格式化JSON对象为HTML
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                    // 删除末尾的冒号
                    match = match.replace(/:$/, '');
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        })
        .replace(/\n/g, '<br>')
        .replace(/\s{2}/g, '&nbsp;&nbsp;');
}

// 格式化解析后的数据
function formatParsedResult(data) {
    // 处理数组
    if (Array.isArray(data)) {
        if (data.length === 0) return '<div class="empty-result">[]</div>';

        return `<div class="result-array">
            ${data.map((item, index) => `
                <div class="result-item">
                    <div class="result-item-header">${index + 1}</div>
                    <div class="result-item-content">
                        ${typeof item === 'object' && item !== null
                ? Object.entries(item).map(([key, value]) => `
                                <div class="result-property">
                                    <strong>${key}:</strong> 
                                    ${formatPropertyValue(value)}
                                </div>`).join('')
                : item}
                    </div>
                </div>
            `).join('')}
        </div>`;
    }
    // 处理对象
    else if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        if (entries.length === 0) return '<div class="empty-result">{}</div>';

        return `<div class="result-object">
            ${entries.map(([key, value]) => `
                <div class="result-property">
                    <strong>${key}:</strong> 
                    ${formatPropertyValue(value)}
                </div>
            `).join('')}
        </div>`;
    }
    // 处理原始值
    else {
        return String(data);
    }
}

// 格式化属性值
function formatPropertyValue(value) {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
                return `[${value.join(', ')}]`;
            }
            return `<span class="expandable-value" onclick="this.classList.toggle('expanded')">
                [数组: ${value.length}项] <span class="preview-content">${formatJSON(value)}</span>
            </span>`;
        } else {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';
            if (keys.length <= 2 && keys.every(k => typeof value[k] !== 'object')) {
                return `{${keys.map(k => `${k}: ${value[k]}`).join(', ')}}`;
            }
            return `<span class="expandable-value" onclick="this.classList.toggle('expanded')">
                {对象: ${keys.length}个属性} <span class="preview-content">${formatJSON(value)}</span>
            </span>`;
        }
    }
    return String(value);
}

// 格式化消息内容，支持基本Markdown
function formatMessage(content) {
    // 处理代码块
    content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // 处理行内代码
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 处理粗体
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 处理斜体
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 处理链接
    content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // 处理换行
    content = content.replace(/\n/g, '<br>');

    return content;
}

// 获取所有可用工具
async function loadTools() {
    try {
        const response = await fetch('/api/tools');
        const data = await response.json();

        // 清空加载中提示
        toolsList.innerHTML = '';

        // 显示工具列表
        if (data.tools && data.tools.length > 0) {

            // "tools": [
            // {
            //     "type": "function",
            //     "function": {
            //        "name": "getProducts",
            //        "description": "获取所有产品信息",
            //        "parameters": {
            //           "type": "object",
            //           "properties": {},
            //           "additionalProperties": false,
            //           "$schema": "http://json-schema.org/draft-07/schema#"
            //        }
            //       }
            //     },
            // ]
            data.tools.forEach(tool => {

                // 提取工具名称和描述
                const tName = tool.function.name;
                const tDescription = tool.function.description || '无描述';
                const tParameters = tool.function.parameters;

                const toolDiv = document.createElement('div');
                toolDiv.className = 'tool-item';

                const toolName = document.createElement('div');
                toolName.className = 'tool-name';
                toolName.textContent = tName;

                const toolDescription = document.createElement('div');
                toolDescription.className = 'tool-description';
                toolDescription.textContent = tDescription || '无描述';

                toolDiv.appendChild(toolName);
                toolDiv.appendChild(toolDescription);

                // 添加参数信息
                if (tParameters && tParameters.properties) {
                    const paramsDiv = document.createElement('div');
                    paramsDiv.className = 'tool-params';

                    Object.entries(tParameters).forEach(([paramName, paramInfo]) => {
                        const paramDiv = document.createElement('div');

                        // 处理基本参数
                        if (paramInfo.description) {
                            paramDiv.innerHTML = `<span class="param-name">${paramName}</span>: ${paramInfo.description}`;
                            paramsDiv.appendChild(paramDiv);
                        }

                        // 处理数组类型的参数
                        if (paramInfo.type === 'array' && paramInfo.items && paramInfo.items.properties) {
                            const nestedParamsDiv = document.createElement('div');
                            nestedParamsDiv.className = 'nested-params';

                            Object.entries(paramInfo.items.properties).forEach(([nestedName, nestedInfo]) => {
                                const nestedParamDiv = document.createElement('div');
                                nestedParamDiv.className = 'nested-param';
                                nestedParamDiv.innerHTML = `<span class="param-name">${paramName}.${nestedName}</span>: ${nestedInfo.description || nestedName}`;
                                nestedParamsDiv.appendChild(nestedParamDiv);
                            });

                            paramsDiv.appendChild(nestedParamsDiv);
                        }
                    });

                    toolDiv.appendChild(paramsDiv);
                }

                toolsList.appendChild(toolDiv);
            });
        } else {
            toolsList.innerHTML = '<div class="loading">没有可用的工具</div>';
        }
    } catch (error) {
        console.error('加载工具失败:', error);
        toolsList.innerHTML = '<div class="loading error">加载工具失败</div>';
    }
}


// 发送消息到服务器
async function sendMessage(message) {
    let thinkingIndicator = null;
    let currentBotMessageContentDiv = null;
    let accumulatedRawText = "";

    try {
        // 显示用户消息
        addMessage(message, true);
        userInput.value = ''; // Clear input after sending

        // 显示思考中指示器
        thinkingIndicator = addThinkingIndicator();

        // 发送请求
        const response = await fetch('/api/chat_sse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                history: messageHistory.slice(0, -1) // 不包括刚刚添加的用户消息
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
            addMessage(`请求出错: ${errorData.error || response.statusText || '未知错误'}`);
            if (thinkingIndicator) thinkingIndicator.remove();
            return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (buffer.trim()) { // Process any remaining buffer content
                    handleStreamEvent(JSON.parse(buffer.trim()));
                }
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep the last partial line in buffer

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const eventData = JSON.parse(line.trim());
                    handleStreamEvent(eventData);
                } catch (e) {
                    console.error('Error parsing stream line:', e, 'Line:', line);
                }
            }
        }

    } catch (error) {
        console.error('发送消息出错:', error);
        if (thinkingIndicator) thinkingIndicator.remove();
        addMessage(`发送消息出错: ${error.message}`);
    }

    function handleStreamEvent(eventData) {
        switch (eventData.type) {
            case 'stream_start':
                if (thinkingIndicator) thinkingIndicator.remove();
                // Create an empty bot message div to hold the streaming content
                currentBotMessageContentDiv = addMessage("", false);
                // Add a placeholder to messageHistory for the upcoming bot message
                messageHistory.push({ role: 'assistant', content: "" });
                break;
            case 'text_delta':
                if (currentBotMessageContentDiv && eventData.content) {
                    accumulatedRawText += eventData.content;
                    // Typewriter effect: append char by char
                    // For simplicity, directly append chunk. True typewriter needs more complex state.
                    // currentBotMessageContentDiv.innerHTML += eventData.content; // Appending raw text
                    typeCharacterByCharacter(currentBotMessageContentDiv, eventData.content);
                    scrollToBottom();
                }
                break;
            case 'tool_call_request':
                // Optionally display something like "AI is considering tool X"
                addSystemMessage(`AI 正在尝试使用工具: ${eventData.data.name}`);
                break;
            case 'tool_call_result':
                // The existing addToolCallMessage should handle this structure
                // eventData.data should be { tool_call_id, name, args, result/error }
                // Ensure args is an object if addToolCallMessage expects it
                let args = eventData.data.args;
                if (typeof args === 'string') {
                    try {
                        args = JSON.parse(args || '{}');
                    } catch (e) {
                        console.warn("Could not parse tool args string for display:", args);
                    }
                }
                addToolCallMessage({ ...eventData.data, args: args });
                break;
            case 'thinking_update':
            case 'final_response_start': // Could be used to change style or add a separator
                addSystemMessage(eventData.content);
                break;
            case 'stream_end':
                if (currentBotMessageContentDiv) {
                    // Apply final formatting to the entire message
                    currentBotMessageContentDiv.innerHTML = formatMessage(accumulatedRawText);
                    // Update the last message in history (which was the placeholder)
                    if (messageHistory.length > 0) {
                        const lastMsg = messageHistory[messageHistory.length - 1];
                        if (lastMsg.role === 'assistant') {
                            lastMsg.content = accumulatedRawText;
                        }
                    }
                }
                accumulatedRawText = ""; // Reset for next message
                currentBotMessageContentDiv = null;
                break;
            case 'error':
                addMessage(`服务器错误: ${eventData.message}`);
                if (thinkingIndicator) thinkingIndicator.remove();
                break;
            default:
                console.warn('Unknown stream event type:', eventData.type);
        }
    }
}



// Helper for character-by-character typing effect
// This is a simplified version. For rapid chunks, it might not look like a smooth typewriter.
// A more robust solution would use a queue and a single typing loop.
let typingQueue = Promise.resolve();

function typeCharacterByCharacter(element, textChunk, speed = 10) {
    typingQueue = typingQueue.then(async () => {
        for (let i = 0; i < textChunk.length; i++) {
            element.innerHTML += textChunk.charAt(i); // Append raw character
            scrollToBottom();
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    });
}


// Modify handleSend to clear input *before* calling sendMessage
function handleSend() {
    const message = userInput.value.trim();
    if (message) {
        // userInput.value = ''; // Moved to inside sendMessage after user message is added
        sendMessage(message);
    }
}

// 绑定事件
sendButton.addEventListener('click', handleSend);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadTools();
    userInput.focus();
}); 