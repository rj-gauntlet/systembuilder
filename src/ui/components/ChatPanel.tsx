import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../ai/types';
import type { AIProvider } from '../../ai/types';
import type { GameState } from '../../engine/types';
import { serializeGameState } from '../../ai/stateSerializer';
import { SYSTEM_PROMPT, buildUserMessage } from '../../ai/prompts';

interface ChatPanelProps {
  provider: AIProvider;
  gameState: GameState;
  prefill?: string;
  onClearPrefill?: () => void;
}

const RATE_LIMIT_KEY = 'systembuilder_chat_count';
const RATE_LIMIT_DATE_KEY = 'systembuilder_chat_date';
const DAILY_LIMIT = 50;

function getRateLimit(): { count: number; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const storedDate = localStorage.getItem(RATE_LIMIT_DATE_KEY);
  if (storedDate !== today) {
    localStorage.setItem(RATE_LIMIT_DATE_KEY, today);
    localStorage.setItem(RATE_LIMIT_KEY, '0');
    return { count: 0, remaining: DAILY_LIMIT };
  }
  const count = parseInt(localStorage.getItem(RATE_LIMIT_KEY) ?? '0', 10);
  return { count, remaining: DAILY_LIMIT - count };
}

function incrementRateLimit(): void {
  const { count } = getRateLimit();
  localStorage.setItem(RATE_LIMIT_KEY, String(count + 1));
}

export function ChatPanel({ provider, gameState, prefill, onClearPrefill }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle prefill from "Ask about this" hint button
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onClearPrefill?.();
    }
  }, [prefill, onClearPrefill]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const { remaining } = getRateLimit();
    if (remaining <= 0) {
      setError('Daily chat limit reached (50/day). Add your own API key in Settings for unlimited use.');
      return;
    }

    setInput('');
    setError(null);

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const stateJson = serializeGameState(gameState);
      const contextualMessage = buildUserMessage(text, stateJson);

      const apiMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'user', content: contextualMessage },
      ];

      const reply = await provider.sendMessage(apiMessages);
      incrementRateLimit();

      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      setMessages([...newMessages, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const { remaining } = getRateLimit();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>AI Tutor</span>
        <span style={styles.headerLimit}>{remaining}/{DAILY_LIMIT} remaining</span>
      </div>

      <div ref={scrollRef} style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            Ask about your architecture, system design concepts, or why something isn't working.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage),
            }}
          >
            <div style={styles.messageRole}>
              {msg.role === 'user' ? 'You' : 'Tutor'}
            </div>
            <div style={styles.messageContent}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.message, ...styles.assistantMessage }}>
            <div style={styles.messageRole}>Tutor</div>
            <div style={styles.messageContent}>Thinking...</div>
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about system design..."
          disabled={loading}
        />
        <button
          style={styles.sendButton}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    background: '#16162a',
    borderLeft: '1px solid #333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #333',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#60a5fa',
  },
  headerLimit: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  empty: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    padding: 20,
    lineHeight: '1.5',
  },
  message: {
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 12,
    lineHeight: '1.5',
  },
  userMessage: {
    background: '#1e3a5f',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    background: '#1e293b',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  messageRole: {
    fontSize: 10,
    fontWeight: 700,
    color: '#64748b',
    marginBottom: 2,
  },
  messageContent: {
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
  },
  error: {
    fontSize: 11,
    color: '#f87171',
    padding: '6px 10px',
    background: '#2d1b1b',
    borderRadius: 6,
  },
  inputRow: {
    display: 'flex',
    gap: 4,
    padding: 8,
    borderTop: '1px solid #333',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: 12,
    outline: 'none',
  },
  sendButton: {
    padding: '8px 14px',
    borderRadius: 6,
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
