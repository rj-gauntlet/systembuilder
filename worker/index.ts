export interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages, model } = (await request.json()) as {
        messages: { role: string; content: string }[];
        model?: string;
      };

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: model ?? 'gpt-4o-mini',
          messages,
          max_tokens: 300,
        }),
      });

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.error?.message ?? 'OpenAI error' }),
          { status: res.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        );
      }

      return new Response(
        JSON.stringify({ reply: data.choices?.[0]?.message?.content ?? '' }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Internal error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
      );
    }
  },
};
