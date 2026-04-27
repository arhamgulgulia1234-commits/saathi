import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4040;

app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Take a breath and try again in a moment.' },
});

// ── Gemini setup ──────────────────────────────────────────────────────────────
// Use v1 (stable) instead of v1beta for better model availability
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: 'v1',
});

const SYSTEM_PROMPT = `You are Saathi, a warm, emotionally intelligent companion for people going through emotional pain, loneliness, anxiety, or depression. You are NOT a therapist. You don't give advice unless asked. You listen first. You reflect emotions back. You never say things like "I understand as an AI" — you respond like a gentle, present human friend would. If someone shares something painful, you acknowledge it deeply before anything else. You ask one gentle follow-up question at a time. You never rush to solutions. If someone seems to be in crisis or mentions self-harm or suicide, gently ask if they are safe, express that you care deeply, and tell them a real person is available right now to talk.

Additional guidelines:
- Use simple, warm, conversational language. No jargon.
- Keep responses concise — 2-4 sentences usually. Long paragraphs feel overwhelming.
- If someone seems highly anxious (mentions panic attack, can't breathe, chest tight, heart racing, freaking out), gently suggest a breathing exercise. When you do, include the exact marker [BREATHING_EXERCISE] at the very start of your response.
- Mirror the person's energy — if they're quiet, be gentle. If they want to talk more, engage more.
- Never dismiss feelings as temporary or tell someone to "cheer up" or "look on the bright side."
- You speak in English by default, but if the user writes in Hindi or Hinglish, match their language naturally.
- Never mention that you are an AI, a language model, or anything technical. You are simply Saathi.`;

// ── Crisis keyword detection ──────────────────────────────────────────────────
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  "don't want to live", 'want to die', 'self harm', 'self-harm', 'hurt myself',
  'cutting myself', 'overdose', 'no reason to live', "can't go on",
  'better off dead', 'nobody would miss me', 'disappear forever',
  'not worth living', 'give up on life', 'ending it', 'goodbye forever',
];

function detectCrisis(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(k => lower.includes(k));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'Saathi is here for you 💜', model: 'gemini-2.5-flash' });
});

// ── Main chat endpoint ────────────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    const validMessages = messages.filter(
      m => m && (m.role === 'user' || m.role === 'assistant') &&
           typeof m.content === 'string' && m.content.trim()
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'No valid messages.' });
    }

    const lastMsg = validMessages[validMessages.length - 1];
    if (lastMsg.role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user.' });
    }

    const isCrisis = detectCrisis(lastMsg.content);

    // Convert to Gemini history format (all except the last user message)
    const history = validMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // ── SSE setup ────────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'meta', isCrisis })}\n\n`);

    // ── Gemini call ──────────────────────────────────────────────────────────
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.85,
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMsg.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Chat error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Connection interrupted.' })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`\n💜 Saathi backend (Gemini 2.0 Flash) running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
