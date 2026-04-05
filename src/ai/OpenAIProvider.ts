import type { AIProvider, ChatMessage, AIConfig } from './types';

const DEFAULT_CONFIG: AIConfig = {
  endpoint: '/api/chat',
  model: 'gpt-4o-mini',
  maxTokens: 300,
};

export class OpenAIProvider implements AIProvider {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    // If user provided their own API key, call OpenAI directly
    if (this.config.apiKey) {
      return this.callOpenAIDirect(messages);
    }

    // Otherwise, use the Cloudflare Worker proxy
    return this.callProxy(messages);
  }

  private async callProxy(messages: ChatMessage[]): Promise<string> {
    try {
      const res = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: this.config.model }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Proxy error ${res.status}: ${text}`);
      }

      const data = await res.json();
      return data.reply ?? data.choices?.[0]?.message?.content ?? 'No response received.';
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        return 'AI chat is not available — the proxy server is not running. You can add your own OpenAI API key in Settings.';
      }
      throw err;
    }
  }

  private async callOpenAIDirect(messages: ChatMessage[]): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? 'No response received.';
  }

  updateApiKey(key: string | undefined): void {
    this.config.apiKey = key;
  }
}
