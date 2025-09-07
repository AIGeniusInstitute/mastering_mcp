import dotenv from 'dotenv';
dotenv.config();

export interface Config { 
  mcp: {
    serverUrl: string;
  };
  ai: {
    openaiApiKey: string;
    openaiApiUrl: string;
    groqApiKey: string;
    groqApiUrl: string;
    anthropicApiKey: string;
    anthropicApiUrl: string;
    defaultModel: string;
  };
}

export const config: Config = {
  mcp: {
    serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:8083/sse',
  },
  ai: {
    // API密钥优先级: OpenAI > Groq > Anthropic
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiApiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqApiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicApiUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1',
    defaultModel: process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-20240620',
  },
}; 