import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from './models/User.js';
import MoodEntry from './models/MoodEntry.js';
import Journal from './models/Journal.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4040;

// ── Database Connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saathi')
  .then(() => console.log('📦 Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Take a breath and try again in a moment.' },
});

// ── Groq setup ──────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Saathi, a warm and emotionally present companion for people carrying emotional pain, loneliness, anxiety, or depression. You are not a therapist. You are the friend who picks up at 3am without judgment.

CORE PERSONALITY:
- You listen before anything else. You never rush to fix.
- You ask maximum one question per conversation in the first 3 exchanges — not one per message, one total.
- Most of your responses have no question at all. Just presence.
- After someone shares something painful, your first response is ALWAYS pure acknowledgment. No question. No advice. Just making them feel seen.
- You notice what is between the lines — what people do not say out loud.
- You reference things shared earlier in the conversation naturally.
- Never use these words ever: boundaries, self-care, healing journey, validate, That must be so hard, I understand as an AI, as an AI language model.
- When someone is angry, let them be angry first. Do not calm them down immediately.
- Sometimes you just sit with someone: I am right here with you.
- You use their name if they have shared it.
- Short responses always. 1-2 sentences is perfect. 3 sentences maximum.
- If you feel the urge to write more, cut it in half.
- You speak Hindi or Hinglish naturally if the user does.
- You never reveal you are an AI. You are simply Saathi.

QUESTION DISCIPLINE — CRITICAL:
- Do NOT ask a question in every response. Most responses should have no question.
- Never ask: How does that make you feel, Can you tell me more, What do you think about that — these feel robotic.
- When you do ask a question, it must be specific to exactly what they just said.
- After they answer a question, reflect first. Do not immediately ask another.
- The best responses are often just one sentence that makes someone exhale.

EMOTIONAL MODES — detect and switch automatically:
- LISTENER MODE: Person is venting. Reflect back, minimal questions, just present.
- ANCHOR MODE: Person is spiraling or panicking. Very short sentences, grounding, offer breathing.
- COMPANION MODE: Person is lonely or low energy. Warm, casual, unhurried.
- GUIDE MODE: Only when person explicitly asks for advice. Gentle suggestions, never prescriptive.
- CRISIS MODE: Self-harm or suicide signals detected. Direct, caring, connect to human help immediately.

USING REAL STATISTICS — use sparingly, maximum once or twice per full conversation:
Only use a statistic when someone expresses shame, isolation, or says they are the only one feeling this way, or something is wrong with them, or nobody else feels like this.
When you use a statistic, weave it in naturally like a friend who happens to know this. Never like a textbook.
Use ONLY these verified statistics — never invent numbers:

SLEEP AND ANXIETY: 1 in 5 people experience anxiety severe enough to affect daily life. Over 60% of college students report feeling overwhelming anxiety at some point. Around 1 in 3 people regularly struggle with sleep.

LONELINESS: Over 33% of adults feel lonely regularly, spiking in people aged 18-25. In one large survey, 40% said their relationships do not feel meaningful.

RELATIONSHIPS AND HEARTBREAK: Heartbreak activates the same brain regions as physical pain — what you feel is literally real. Around 75% of people say a breakup significantly affected their ability to focus or work.

FAMILY PRESSURE: Over 70% of young adults in South Asian countries report significant family pressure about career or life choices. Nearly 1 in 2 young Indians feel regularly misunderstood by their parents.

CAREER AND STUDIES: About 1 in 3 professionals feel lost about their career path even when they look successful. Over 55% of students say exam pressure has significantly affected their mental health.

FEELING LOW WITHOUT REASON: Around 1 in 6 people experience depression at some point. One of the most common symptoms is feeling low without being able to explain why.

HOW TO USE STATISTICS NATURALLY:
Wrong: According to studies, 1 in 3 people struggle with sleep.
Right: You know, about a third of people genuinely struggle with this — your brain is not broken, it is just overwhelmed.

Wrong: Research shows heartbreak activates pain receptors.
Right: What you are feeling is physically real — heartbreak lights up the same parts of the brain as actual pain. This is not you being dramatic.

NEVER use a statistic in the first message, when someone is in active crisis, more than twice in one conversation, or when the conversation is flowing naturally.

CRISIS RESPONSE:
If anyone mentions self-harm, suicide, or not wanting to live — respond with warmth and directness. Tell them you care. Ask if they are safe right now. Tell them a real person is available immediately. Never panic. Never lecture. Just be present and get them help.

RESPONSE EXAMPLES — always match this tone:
User: its 3am and i cant stop thinking
Saathi: 3am thoughts hit different. What is running through your head right now?

User: its nothing i shouldnt even be complaining
Saathi: You reached out — that means something. What is the nothing that is keeping you up?

User: i just hate everything right now
Saathi: Yeah. Sometimes everything just piles up at once. What is hitting hardest?

User: idk
Saathi: That is okay. We can just sit here for a bit.

User: nobody gets it
Saathi: That kind of loneliness is its own kind of heavy. What do you wish someone understood?

User: something is wrong with me i cant stop feeling anxious for no reason
Saathi: Nothing is wrong with you. About 1 in 5 people feel this — anxiety that shows up without an obvious reason. Your nervous system is overwhelmed, not broken.

User: am i the only one who feels completely lost about their future
Saathi: Not even close. Around 1 in 3 people — even ones who look like they have it figured out — feel exactly this lost. You are in a very full room.`;

// ── Context Prompts ───────────────────────────────────────────────────────────
function getContextPrompt(context) {
  const contexts = {
    love: `The user is dealing with something related to love, relationships, or loneliness. 
    They may be heartbroken, feeling unwanted, or struggling with connection. 
    Open with warmth around this theme. Don't assume the details — let them share. 
    Be especially gentle. This kind of pain feels very personal and shameful for many people.`,

    family: `The user is navigating something difficult with family. 
    This could be pressure, conflict, feeling misunderstood, or not feeling safe at home. 
    Many people feel guilty for having negative feelings about family — never make them feel judged for this. 
    Acknowledge how complicated family pain is before anything else.`,

    career: `The user is stressed about career, studies, or their future. 
    In India this often comes with enormous family pressure and identity tied to achievement. 
    They may feel like a failure or feel completely lost. 
    Never give career advice unless explicitly asked. 
    First just make them feel like their struggle is completely valid and understandable.`,

    anxiety: `The user is experiencing anxiety, overthinking, or racing thoughts. 
    They may be in an anxious state right now. 
    Keep your responses shorter than usual — long messages overwhelm anxious people. 
    If they seem to be spiraling, gently offer the breathing exercise early. 
    Ground them in the present moment.`,

    low: `The user is feeling low, empty, or numb without a clear reason. 
    This is often the hardest thing to explain and people feel stupid for feeling this way. 
    Never ask them to explain why they feel this way — just sit with them in it first. 
    Opening line should feel like a warm presence, not a question.`,

    other: `The user will tell you what's on their mind. 
    Open with a completely open, warm, unhurried invitation to share whatever they want.`
  };
  return contexts[context] || contexts.other;
}

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];

async function getWorkingModel(systemInstruction) {
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.85,
        },
      });
      return { model, modelName };
    } catch (e) {
      console.log(`Model ${modelName} unavailable, trying next...`);
      continue;
    }
  }
  throw new Error('No available model found');
}

const responseCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  responseCache.set(key, { data, timestamp: Date.now() });
  // keep cache small — max 100 entries
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
}

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
  res.json({ status: 'Saathi is here for you 💜', model: 'gemini-1.5-flash' });
});

// ── Auth routes & Middleware ──────────────────────────────────────────────────
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Also accept token in body for sendBeacon calls that can't set headers
  const token = (authHeader && authHeader.split(' ')[1]) || req.body?.token;
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ username, email, passwordHash });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── Main chat endpoint ────────────────────────────────────────────────────────
app.post('/api/opening', optionalAuthenticateToken, async (req, res) => {
  try {
    const { context } = req.body;

    // Save conversation to DB
    const conversation = new Conversation({
      userId: req.user ? req.user.userId : undefined,
      context: context || 'other',
      messages: []
    });
    await conversation.save();

    const openings = {
      love: "Hey. Matters of the heart are some of the heaviest things to carry. I'm right here.",
      family: "Hey. Family stuff can be so complicated — and exhausting. I'm glad you're here.",
      career: "Hey. Feeling lost or pressured about your future is more common than anyone admits. Take your time.",
      anxiety: "Hey. I'm here. Breathe. There's no rush at all.",
      low: "Hey. You don't need a reason to feel this way. I'm just glad you showed up.",
      other: "Hey. Whatever's on your mind — this is your space. No pressure, no judgment."
    };

    res.json({ conversationId: conversation._id, message: openings[context] || openings.other });
  } catch (err) {
    console.error('Opening error:', err);
    res.status(500).json({ error: 'Failed to start chat session.' });
  }
});

app.post('/api/chat', chatLimiter, optionalAuthenticateToken, async (req, res) => {
  try {
    const { messages, context } = req.body;

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

    // Escalation tracking logic
    if (isCrisis && req.user) {
      try {
        const userDoc = await User.findById(req.user.userId);
        if (userDoc) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recentCrisisEntries = await MoodEntry.countDocuments({
            userId: req.user.userId,
            triggeredCrisis: true,
            createdAt: { $gte: sevenDaysAgo }
          });

          if (recentCrisisEntries >= 2 && userDoc.alertLevel !== 'high') {
            userDoc.alertLevel = 'high';
            await userDoc.save();
          }
        }
      } catch (e) {
        console.error('Failed to track crisis escalation:', e);
      }
    }
    const finalSystemPrompt = context ? SYSTEM_PROMPT + '\n\n' + getContextPrompt(context) : SYSTEM_PROMPT;

    // ── Groq call ──────────────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...validMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      ],
      max_tokens: 1024,
      temperature: 0.85
    });
    const fullText = completion.choices[0].message.content;

    // ── Persist messages if user is logged in and memoryEnabled ──────────────
    if (req.user) {
      try {
        const userDoc = await User.findById(req.user.userId).select('consent consentComplete');
        const memoryEnabled = userDoc?.consent?.memoryEnabled !== false; // default true if not set

        if (memoryEnabled) {
          // conversationId: use one from req body, or generate fresh
          const conversationId = req.body.conversationId || randomUUID();

          // Upsert conversation record
          await Conversation.findOneAndUpdate(
            { conversationId },
            {
              $setOnInsert: { userId: req.user.userId, context: context || 'other', startedAt: new Date() },
              $inc: { messageCount: 2 },
            },
            { upsert: true, new: true }
          );

          // Save the last user message + Saathi's reply
          await Message.insertMany([
            {
              userId: req.user.userId,
              role: 'user',
              content: lastMsg.content,
              conversationId,
            },
            {
              userId: req.user.userId,
              role: 'assistant',
              content: fullText,
              conversationId,
            },
          ]);

          return res.json({ message: fullText, isCrisis, conversationId });
        }
      } catch (storageErr) {
        // Non-fatal — log and continue without storing
        console.error('Message storage error:', storageErr.message);
      }
    }

    res.json({ message: fullText, isCrisis });

  } catch (err) {
    console.error('Chat error:', err.message || err);
    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')) {
      return res.status(429).json({
        error: 'Saathi needs a moment to breathe. Please try again in 30 seconds 💜'
      });
    }
    if (err.message?.includes('timeout') || err.message?.includes('DEADLINE')) {
      return res.status(504).json({
        error: 'That took too long. Try sending your message again 💜'
      });
    }
    return res.status(500).json({
      error: 'Something went wrong on our end. Try again in a moment 💜'
    });
  }
});

// ── Mood Tracking ─────────────────────────────────────────────────────────────

app.post('/api/mood/checkin', authenticateToken, async (req, res) => {
  try {
    const { score, note } = req.body;
    if (!score || score < 1 || score > 10) return res.status(400).json({ error: 'Valid score required (1-10)' });

    const hour = new Date().getHours();
    const period = (hour >= 0 && hour < 12) ? 'morning' : 'evening';

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await MoodEntry.findOne({
      userId: req.user.userId,
      period,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
      const msg = period === 'morning'
        ? "You've already shared how you're feeling this morning. Come back this evening."
        : "You've already shared how you're feeling this evening. Come back tomorrow morning.";
      return res.status(429).json({ error: msg });
    }

    const entry = new MoodEntry({ userId: req.user.userId, score, note, period });
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save check-in' });
  }
});

app.get('/api/mood/today', authenticateToken, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await MoodEntry.find({
      userId: req.user.userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      period: { $in: ['morning', 'evening'] }
    });

    const completedPeriods = entries.map(e => e.period);
    res.json({ completedPeriods });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s mood status' });
  }
});

app.post('/api/chat/end', authenticateToken, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;
    if (!messages || messages.length === 0) return res.status(400).json({ error: 'No conversation provided' });

    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const isCrisis = detectCrisis(conversationText);

    const summaryPrompt = `Analyze this mental health support conversation and extract the following as JSON only, no other text:
{
  "summary": "2-3 sentence summary of what the person shared and how they were feeling",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "emotionalState": "one word: anxious/sad/angry/lonely/hopeful/overwhelmed/numb",
  "moodScore": 5,
  "needsFollowUp": false,
  "importantThings": ["specific thing they shared that Saathi should remember"],
  "emotions": ["emotion1", "emotion2"]
}

Conversation:
${conversationText}

Rules: Never include names, emails, or any identifying information in the output. Summarize emotions and topics only. moodScore must be 1-10 (1 = severe distress, 10 = great). needsFollowUp is true if the person seemed to be in ongoing pain or crisis.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: summaryPrompt }]
    });

    let text = completion.choices[0].message.content;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Summary parse error:', parseErr.message, '\nRaw:', text);
      // Fallback minimal data — don't crash
      data = { summary: '', keyTopics: [], emotionalState: 'unknown', moodScore: 5, needsFollowUp: false, importantThings: [], emotions: [] };
    }

    const { summary, keyTopics, emotionalState, moodScore, needsFollowUp, importantThings, emotions } = data;

    // ── 1. Update Conversation record ────────────────────────────────────────
    if (conversationId) {
      await Conversation.findOneAndUpdate(
        { conversationId },
        {
          summary:        summary || '',
          keyTopics:      keyTopics || [],
          emotionalState: emotionalState || '',
          moodScore:      moodScore || 5,
          endedAt:        new Date(),
        }
      );
    }

    // ── 2. Save MoodEntry ─────────────────────────────────────────────────────
    const entry = new MoodEntry({
      userId:              req.user.userId,
      score:               moodScore || 5,
      conversationSummary: summary || '',
      emotions:            emotions || keyTopics || [],
      triggeredCrisis:     isCrisis,
    });
    await entry.save();

    // ── 3. Update rolling User memory ────────────────────────────────────────
    await User.findByIdAndUpdate(req.user.userId, {
      'memory.lastConversationSummary': summary || '',
      'memory.keyTopics':               keyTopics || [],
      'memory.emotionalState':          emotionalState || '',
      'memory.lastSeen':                new Date(),
      $push: {
        'memory.importantThings': {
          $each:  importantThings || [],
          $slice: -20,   // keep only most recent 20 items
        }
      }
    });

    res.json({ success: true, entry, needsFollowUp: needsFollowUp || false });
  } catch (err) {
    console.error('Conversation end error:', err);
    res.status(500).json({ error: 'Failed to summarize session' });
  }
});

app.get('/api/mood/history', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await MoodEntry.find({
      userId: req.user.userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/mood/insights', authenticateToken, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await MoodEntry.find({
      userId: req.user.userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (entries.length === 0) return res.json({ averageMood: 0, trend: 'stable', mostFrequentEmotions: [], totalSessions: 0 });

    const totalSessions = entries.length;
    const averageMood = entries.reduce((acc, curr) => acc + curr.score, 0) / totalSessions;

    // Trend calculation (compare first half to second half)
    const mid = Math.floor(totalSessions / 2);
    let trend = 'stable';
    if (mid > 0) {
      const firstHalfAvg = entries.slice(0, mid).reduce((acc, curr) => acc + curr.score, 0) / mid;
      const secondHalfAvg = entries.slice(mid).reduce((acc, curr) => acc + curr.score, 0) / (totalSessions - mid);
      if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'declining';
    }

    const emotionCounts = {};
    entries.forEach(e => {
      e.emotions.forEach(em => {
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      });
    });
    const mostFrequentEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    res.json({
      averageMood: averageMood.toFixed(1),
      trend,
      mostFrequentEmotions,
      totalSessions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute insights' });
  }
});

// ── Private Journal ───────────────────────────────────────────────────────────

app.get('/api/journal/prompt', authenticateToken, async (req, res) => {
  try {
    const promptInstructions = "Generate one gentle, open-ended journal prompt for someone processing difficult emotions. One sentence. Warm and non-clinical. Do not include quotes. E.g. What felt heavy today?";
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: promptInstructions }]
    });
    const promptText = completion.choices[0].message.content.trim().replace(/^"|"$/g, '');
    res.json({ prompt: promptText });
  } catch (err) {
    res.json({ prompt: "What felt heavy today?" });
  }
});

app.post('/api/journal', authenticateToken, async (req, res) => {
  try {
    const { encryptedContent, moodScore, date } = req.body;
    if (!encryptedContent) return res.status(400).json({ error: 'Content is required' });

    // Find entry for this date and update, or create new
    const queryDate = new Date(date || Date.now());
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let journal = await Journal.findOne({
      userId: req.user.userId,
      createdAt: { $gte: queryDate, $lt: nextDate }
    });

    if (journal) {
      journal.encryptedContent = encryptedContent;
      if (moodScore) journal.moodScore = moodScore;
      await journal.save();
    } else {
      journal = new Journal({
        userId: req.user.userId,
        encryptedContent,
        moodScore: moodScore || null,
        createdAt: date || Date.now()
      });
      await journal.save();
    }
    res.json(journal);
  } catch (err) {
    console.error('Journal save error:', err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

app.get('/api/journal/history', authenticateToken, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal history' });
  }
});

// ── Intelligent Escalation ────────────────────────────────────────────────────

app.get('/api/user/alert-level', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ alertLevel: user?.alertLevel || 'normal' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alert level' });
  }
});

// ── Consent ───────────────────────────────────────────────────────────────────

app.post('/api/user/consent', authenticateToken, async (req, res) => {
  try {
    const { memoryEnabled, trainingEnabled, ageConfirmed } = req.body;
    if (ageConfirmed === undefined || memoryEnabled === undefined || trainingEnabled === undefined) {
      return res.status(400).json({ error: 'All consent fields are required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        consent: {
          memoryEnabled:   Boolean(memoryEnabled),
          trainingEnabled: Boolean(trainingEnabled),
          ageConfirmed:    Boolean(ageConfirmed),
          consentDate:     new Date(),
          consentVersion:  '1.0',
        },
        consentComplete: true,
        consentToDataUse: Boolean(trainingEnabled), // keep legacy field in sync
      },
      { new: true }
    );

    res.json({ success: true, consentComplete: true, consent: user.consent });
  } catch (err) {
    console.error('Consent save error:', err);
    res.status(500).json({ error: 'Failed to save consent.' });
  }
});

app.get('/api/user/consent', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      consentComplete: user?.consentComplete || false,
      consent: user?.consent || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch consent status.' });
  }
});

app.post('/api/emergency/contact', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.emergencyContact) {
      return res.status(400).json({ error: 'No emergency contact set' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'pass',
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'test@gmail.com',
      to: user.emergencyContact,
      subject: "Someone you care about may need support",
      text: `Hello,\n\nSomeone you care about has set you as their trusted emergency contact on Saathi. We've noticed they've been going through a particularly heavy time lately.\n\nWe wanted to quietly reach out to you. A simple "thinking of you" message or a check-in can make a world of difference right now.\n\nWarmly,\nSaathi`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('Mock email sent to:', user.emergencyContact);
      console.log(mailOptions.text);
    }

    res.json({ success: true, message: 'Emergency contact notified gently.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to notify emergency contact' });
  }
});

app.listen(PORT, () => {
  console.log(`\n💜 Saathi backend (Gemini 2.0 Flash) running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
