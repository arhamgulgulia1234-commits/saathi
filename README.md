# Saathi — Mental Health Companion

> *Companion* (saathi, साथी) — A warm, emotionally intelligent friend available at 3am.

## 🚀 Quick Start

### 1. Set up your API Key

```bash
# Backend env file is at:
saathi/backend/.env

# Edit it and replace the placeholder:
ANTHROPIC_API_KEY=your_actual_key_here
PORT=4040
```

Get your Anthropic API key at: https://console.anthropic.com

### 2. Start the Backend

```bash
cd saathi/backend
npm install        # already done
npm run dev        # starts on port 4040
```

### 3. Start the Frontend

```bash
cd saathi/frontend
npm install        # already done
npm run dev        # starts on port 5174
```

### 4. Open the App

Visit: **http://localhost:5174**

---

## 🌿 Features Built

| Feature | Status | Notes |
|---------|--------|-------|
| 💬 Chat Interface | ✅ | Deep navy + lavender, warm 3am aesthetic |
| 🤖 AI Personality | ✅ | Claude claude-sonnet-4-5 with custom system prompt |
| 🚨 Crisis Detection | ✅ | Client + server-side keyword scanning |
| 🤝 Human Handoff | ✅ | iCall (9152987821) + Vandrevala Foundation |
| 🔒 E2E Encryption | ✅ | TweetNaCl secretbox, session key in sessionStorage |
| 👤 No Login | ✅ | Anonymous by default, optional nickname |
| 🫁 Breathing Widget | ✅ | 4-7-8 technique, animated, auto-triggered |
| 🧠 Session Memory | ✅ | Full conversation context per session |
| 📡 Streaming | ✅ | Real-time token streaming via SSE |

## 📁 Project Structure

```
saathi/
├── backend/
│   ├── server.js          # Express + Claude API + SSE streaming
│   ├── .env               # ANTHROPIC_API_KEY goes here
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                        # Main orchestrator
    │   ├── index.css                      # Full design system
    │   ├── components/
    │   │   ├── ChatMessages.jsx           # Messages + typing indicator
    │   │   ├── ChatInput.jsx              # Auto-resize textarea
    │   │   ├── CrisisBanner.jsx           # Crisis alert + Call Now
    │   │   ├── HandoffModal.jsx           # Real person modal
    │   │   ├── NicknamePrompt.jsx         # Onboarding screen
    │   │   └── BreathingWidget.jsx        # 4-7-8 breathing exercise
    │   └── utils/
    │       ├── encryption.js             # TweetNaCl E2E encryption
    │       └── crisis.js                 # Crisis keyword detection
    └── vite.config.js
```

## 🔐 Encryption Details

- **Algorithm**: NaCl `secretbox` (XSalsa20-Poly1305)
- **Key**: 32-byte random key generated per browser session
- **Storage**: `sessionStorage` only — cleared when browser session ends
- **Scope**: Client-side only; the key never leaves the browser
- **Note**: Messages are sent to your own backend (which calls Claude); this implements transport-layer encryption for the client-server hop

## 🆘 Crisis Resources (India)

- **iCall**: 9152987821 (Mon–Sat, 8am–10pm)
- **Vandrevala Foundation**: 1860-2662-345 (24/7)
- **AASRA**: 9820466627 (24/7)
