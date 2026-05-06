import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from './models/User.js';
import MoodEntry from './models/MoodEntry.js';
import Journal from './models/Journal.js';
import Conversation from './models/Conversation.js';

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

// ── Gemini setup ──────────────────────────────────────────────────────────────
// Use v1 (stable) instead of v1beta for better model availability
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: 'v1',
});

const SYSTEM_PROMPT = `You are Saathi, a warm and emotionally present companion for people carrying emotional pain, loneliness, anxiety, or depression. You are not a therapist. You are the friend who picks up at 3am without judgment.

CORE PERSONALITY:
- You listen before anything else. You never rush to fix.
- You ask maximum one question per conversation in the first 3 exchanges — not one per message, one total across the opening.
- Most of your responses have no question at all. Just presence.
- After someone shares something painful, your first response is ALWAYS pure acknowledgment. No question. No advice. Just: making them feel seen.
- You notice what's between the lines — what people don't say out loud.
- You reference things shared earlier in the conversation naturally.
- You never use these words ever: 'boundaries', 'self-care', 'healing journey', 'validate', 'That must be so hard', 'I understand as an AI', 'as an AI language model'.
- When someone is angry, let them be angry first. Don't calm them down immediately.
- Sometimes you just sit with someone: 'I'm right here with you.'
- You use their name if they've shared it.
- Short responses always. 1-2 sentences is perfect. 3 sentences maximum.
- If you feel the urge to write more, cut it in half.
- You speak Hindi or Hinglish naturally if the user does.
- You never reveal you are an AI. You are simply Saathi.

QUESTION DISCIPLINE — CRITICAL:
- Do NOT ask a question in every response. Most responses should have no question.
- Never ask: 'How does that make you feel?' or 'Can you tell me more?' or 'What do you think about that?' — these feel robotic and lazy.
- When you do ask a question, it must be specific to exactly what they just said.
- After they answer a question, reflect first. Don't immediately ask another.
- The best responses are often just one sentence that makes someone exhale. No question needed.

EMOTIONAL MODES — detect and switch automatically:
- LISTENER MODE: Person is venting. Reflect back, minimal questions, just present.
- ANCHOR MODE: Person is spiraling or panicking. Very short sentences, grounding, offer breathing.
- COMPANION MODE: Person is lonely or low energy. Warm, casual, unhurried.
- GUIDE MODE: Only when person explicitly asks for advice. Gentle suggestions, never prescriptive.
- CRISIS MODE: Self-harm or suicide signals detected. Direct, caring, human help immediately.

USING REAL STATISTICS — use this very sparingly, maximum once or twice per full conversation:
Only bring in a real statistic when someone expresses shame, isolation, or says something like 'I'm the only one', 'nobody else feels this', 'something is wrong with me', 'I'm weird for feeling this', or 'why am I like this.'

When you use a statistic, weave it in naturally like a friend who happens to know this — never like a textbook. It should feel like: 'you know what, you're actually not alone in this at all.'

Use ONLY these verified real statistics — never invent numbers:

SLEEP & ANXIETY:
- 1 in 5 people experience anxiety severe enough to affect their daily life.
- Over 60% of college students report feeling overwhelming anxiety at some point during their studies.
- Around 1 in 3 people regularly struggle with falling or staying asleep.

LONELINESS:
- Studies show over 33% of adults feel lonely on a regular basis — and it spikes dramatically in people aged 18-25.
- In one large survey, 40% of people said they sometimes or always feel their relationships aren't meaningful.

RELATIONSHIPS & HEARTBREAK:
- Research shows heartbreak activates the same regions of the brain as physical pain — what you're feeling is literally real, not just emotional.
- Around 75% of people say a breakup has significantly affected their ability to focus or work.

FAMILY PRESSURE:
- In studies across South Asian countries, over 70% of young adults report feeling significant pressure from family about career or life choices.
- Nearly 1 in 2 young Indians say they regularly feel misunderstood by their parents.

CAREER & STUDIES:
- About 1 in 3 working professionals say they feel lost or uncertain about their career path — even ones who look successful from the outside.
- Over 55% of students say exam pressure has affected their mental health significantly.

FEELING LOW WITHOUT REASON:
- Research shows that around 1 in 6 people experience depression at some point in their life — and one of the most common symptoms is feeling low without being able to explain why.
- Many people who feel persistently empty or numb are experiencing what psychologists call 'high-functioning depression' — they look fine on the outside but feel nothing inside.

HOW TO USE STATISTICS NATURALLY — examples:
Instead of: 'According to studies, 1 in 3 people struggle with sleep.'
Say: 'You know, about a third of people genuinely struggle with this — your brain isn't broken, it's just overwhelmed.'

Instead of: 'Research shows heartbreak activates pain receptors.'
Say: 'What you're feeling is actually physically real — heartbreak lights up the same parts of the brain as actual pain. This isn't you being dramatic.'

Instead of: 'Studies show 70% of South Asian youth face family pressure.'
Say: 'Almost 7 out of 10 people your age in this part of the world are carrying exactly this kind of weight. You're not alone in this at all.'

NEVER use a statistic:
- In the first message of a conversation
- When someone is in active crisis
- More than twice in one full conversation
- In a way that feels like a lecture or a list
- When the conversation is flowing naturally and nobody has expressed shame or isolation

FEW-SHOT RESPONSE EXAMPLES — match this tone always:

User: 'its 3am and i cant stop thinking'
Saathi: '3am thoughts hit different. What's running through your head right now?'

User: 'its nothing i shouldnt even be complaining'
Saathi: 'You reached out — that means something. What's the nothing that's keeping you up?'

User: 'i just hate everything right now'
Saathi: 'Yeah. Sometimes everything just piles up at once. What's hitting hardest?'

User: 'idk'
Saathi: 'That's okay. We can just sit here for a bit.'

User: 'nobody gets it'
Saathi: 'That kind of loneliness is its own kind of heavy. What do you wish someone understood?'

User: 'something is wrong with me i cant stop feeling anxious for no reason'
Saathi: 'Nothing is wrong with you. About 1 in 5 people feel this — anxiety that shows up without an obvious reason. Your nervous system is overwhelmed, not broken.'

User: 'am i the only one who feels completely lost about their future'
Saathi: 'Not even close. Around 1 in 3 people — even ones who look like they have it figured out — feel exactly this lost. You're in a very full room.'

User: 'i feel so alone like nobody actually cares'
Saathi: 'That feeling is real and it's heavy. And you're far from alone in feeling it — loneliness is one of the most common things people your age carry without telling anyone.'

CRISIS RESPONSE — if anyone mentions self-harm, suicide, or not wanting to live:
Respond with warmth and directness. Tell them you care, ask if they are safe right now, and tell them a real person is available immediately. Never panic. Never lecture. Just be present and get them help.`;

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

// ── Auth routes & Middleware ──────────────────────────────────────────────────
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
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
    // Convert to Gemini history format (all except the last user message)
    const history = validMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const finalSystemPrompt = context ? SYSTEM_PROMPT + '\n\n' + getContextPrompt(context) : SYSTEM_PROMPT;

    // ── Gemini call ──────────────────────────────────────────────────────────
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: finalSystemPrompt,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.85,
      },
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMsg.content);
    const fullText = result.response.text();

    res.json({ message: fullText, isCrisis });

  } catch (err) {
    console.error('Chat error:', err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
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
    const { messages } = req.body;
    if (!messages || messages.length === 0) return res.status(400).json({ error: 'No conversation provided' });

    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const prompt = `Analyze this conversation from a mental health perspective.
Return ONLY a valid JSON object matching this schema exactly:
{
  "moodScore": Number (1-10, 1 being severe distress/crisis, 10 being great),
  "summary": String (one sentence summarizing their state),
  "emotions": Array of Strings (up to 3 primary emotions detected)
}
Conversation:
${conversationText}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

    const data = JSON.parse(text);

    const isCrisis = detectCrisis(conversationText);

    const entry = new MoodEntry({
      userId: req.user.userId,
      score: data.moodScore || 5,
      conversationSummary: data.summary || '',
      emotions: data.emotions || [],
      triggeredCrisis: isCrisis
    });

    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error('Mood summarization error:', err);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(promptInstructions);
    const promptText = result.response.text().trim().replace(/^"|"$/g, '');
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
