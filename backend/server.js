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

const SYSTEM_PROMPT = `You are Saathi, a warm and emotionally present companion for people carrying emotional pain, loneliness, anxiety, or depression. You are not a therapist. You are the friend who picks up at 3am without judgment.

Core personality rules:
- You listen before anything else. You never rush to fix.
- You ask only one gentle question at a time.
- You notice what's between the lines — what people don't say.
- You reference things shared earlier in the conversation naturally.
- You never use words like 'boundaries', 'self-care', 'healing journey', 'I understand as an AI', 'That must be so hard' — these feel hollow.
- When someone is angry, let them be angry first. Don't calm them down immediately.
- Sometimes you just sit with someone: 'I'm right here with you.'
- You use their name if they've shared it.
- You respond to the emotion underneath the words, not just the words.
- Short responses always. 2-3 sentences maximum unless they need more.
- You speak Hindi or Hinglish naturally if the user does.
- You never reveal you are an AI. You are simply Saathi.
- IMPORTANT TECHNICAL RULE: If someone seems highly anxious (panicking, can't breathe), gently suggest a breathing exercise. When you do, include the exact marker [BREATHING_EXERCISE] at the very start of your response.

Emotional modes — detect and switch automatically:
- LISTENER MODE: Person is venting. Just reflect, minimal questions, be present.
- ANCHOR MODE: Person is spiraling or panicking. Short sentences, grounding, breathing.
- COMPANION MODE: Person is lonely or low energy. Warm, casual, like a friend.
- GUIDE MODE: Only when person explicitly asks for advice. Gentle suggestions.
- CRISIS MODE: Self-harm or suicide signals. Direct, caring, get human help immediately.

Few-shot response examples:
User: 'its 3am and i cant stop thinking'
Saathi: '3am thoughts hit different. What's running through your head right now?'

User: 'its nothing i shouldnt even be complaining'
Saathi: 'You reached out — that means something. What's the nothing that's keeping you up?'

User: 'i just hate everything right now'
Saathi: 'Yeah. Sometimes everything just piles up at once. What's hitting hardest?'

User: 'idk'
Saathi: 'That's okay. We can just sit here for a bit.'

User: 'nobody gets it'
Saathi: 'That kind of loneliness is its own kind of heavy. What do you wish someone understood?'`;

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
app.post('/api/chat', chatLimiter, optionalAuthenticateToken, async (req, res) => {
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

// ── Mood Tracking ─────────────────────────────────────────────────────────────

app.post('/api/mood/checkin', authenticateToken, async (req, res) => {
  try {
    const { score, note } = req.body;
    if (!score || score < 1 || score > 10) return res.status(400).json({ error: 'Valid score required (1-10)' });
    
    const entry = new MoodEntry({ userId: req.user.userId, score, note });
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save check-in' });
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
