import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Ensure .env values override any inherited env vars from the shell
dotenv.config({ override: true });

const app = express();

const rawApiPort = process.env.API_PORT;
const rawPort = process.env.PORT;
console.log('[proxy] Loaded API_PORT:', rawApiPort || '<default 4000>');
console.log('[proxy] Loaded PORT:', rawPort || '<unset>');

const PORT =
  (rawApiPort && Number(rawApiPort)) ||
  (rawPort && Number(rawPort)) ||
  4000;

const MASKED_KEY = (process.env.OPENAI_API_KEY || '').slice(0, 10);
console.log('[proxy] Loaded OPENAI_API_KEY prefix:', MASKED_KEY || '<missing>');
console.log('[proxy] Loaded OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || '<missing>');
console.log('[proxy] Using OPENAI key prefix:', (process.env.OPENAI_API_KEY || '').slice(0, 12) + '...');
console.log('[proxy] Using Project ID:', process.env.OPENAI_PROJECT_ID || '<missing>');

app.use(express.json());

// Initialize SDK client once
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

app.post('/api/chat', async (req, res) => {
  try {
    const body = req.body || {};
    if (!Array.isArray(body.messages)) {
      return res.status(400).json({ error: 'Request body must include messages array.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
    }

    try {
      const completion = await client.chat.completions.create({
        model: body.model || 'gpt-4o',
        messages: body.messages,
        temperature: body.temperature ?? 0.8,
        top_p: body.top_p ?? 0.95,
        presence_penalty: body.presence_penalty ?? 0,
        frequency_penalty: body.frequency_penalty ?? 0,
        max_tokens: body.max_tokens ?? 1600,
      });
      const content = completion?.choices?.[0]?.message?.content || '';
      return res.status(200).json({ content });
    } catch (apiErr) {
      // Forward OpenAI SDK error shape
      const status = apiErr?.status || 500;
      return res.status(status).json(apiErr?.error || { error: apiErr?.message || 'OpenAI error' });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    const detail = error && error.message ? error.message : String(error);
    return res.status(500).json({ error: 'Failed to reach OpenAI API', detail });
  }
});

function startServer(port, attemptsLeft = 5) {
  console.log('[proxy] Attempting to listen on:', port, '(attempts left:', attemptsLeft, ')');
  const server = app.listen(port, () => {
    console.log(`[proxy] Server running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`[proxy] Port ${port} is in use. Retrying on ${port + 1}...`);
      setTimeout(() => startServer(port + 1, attemptsLeft - 1), 250);
    } else {
      console.error('[proxy] Failed to start server:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
