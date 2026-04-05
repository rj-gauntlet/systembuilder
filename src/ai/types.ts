export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  sendMessage(messages: ChatMessage[]): Promise<string>;
}

export interface AIConfig {
  apiKey?: string;
  endpoint: string;
  model: string;
  maxTokens: number;
}
