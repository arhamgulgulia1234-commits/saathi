import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import '../index.css';
import { encryptMessage } from '../utils/encryption';
import { detectCrisis } from '../utils/crisis';

// ─── Constants ────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `m${++_id}_${Date.now()}`;
const API = import.meta.env.VITE_API_URL || '';

const STARTERS = [
  "I've been feeling really low lately",
  "I can't sleep and my mind won't stop",
  "I just need someone to talk to",
  "I'm feeling completely overwhelmed",
  "I don't know what's wrong with me",
  "I feel like nobody understands me",
];

const FEATURES = [
  { icon: '🔒', label: 'End-to-end encrypted' },
  { icon: '👤', label: 'Anonymous by default' },
  { icon: '🚫', label: 'Nothing ever stored' },
  { icon: '🤝', label: 'Human backup always available' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="typing-indicator" aria-label="Saathi is typing">
    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
  </div>
);

const Bubble = memo(({ msg, onSave }) => {
  const isUser = msg.role === 'user';
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (isUser) return;
    setIsSaved(!isSaved);
    if (onSave) onSave(msg, !isSaved);
  };

  return (
    <div className={`message-group ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="ai-avatar" aria-hidden="true">✨</div>
      )}
      <div className="msg-content">
        <div 
          className={`message-bubble ${!isUser ? 'clickable' : ''}`} 
          onClick={handleSave}
          title={!isUser ? "Tap to save this moment" : ""}
        >
          {msg.content}
          {msg.streaming && <span className="streaming-cursor" aria-hidden="true" />}
          {isSaved && !isUser && <span className="msg-reaction">🤎</span>}
        </div>
        {!msg.streaming && (
          <span className="message-time">{formatTime(msg.timestamp || new Date())}</span>
        )}
      </div>
    </div>
  );
});
Bubble.displayName = 'Bubble';

function CrisisBanner({ onDismiss }) {
  return (
    <div className="crisis-banner" role="alert" aria-live="assertive">
      <div className="crisis-text">
        <span>🤎</span>
        <p><strong>You don't have to face this alone.</strong>{' '}A real person is here for you right now.</p>
      </div>
      <div className="crisis-actions">
        <a href="tel:9152987821" className="btn-call" id="crisis-call-btn">📞 Call Now</a>
        <button className="btn-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
      </div>
    </div>
  );
}

function HandoffModal({ onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Talk to a real person 🤎</h3>
        <p className="sub">Trained, caring humans — free and confidential.</p>
        <div className="helpline-card">
          <p className="name">iCall — India</p>
          <p className="number">9152987821</p>
          <p className="desc">Mon–Sat, 8am–10pm · Free & confidential</p>
        </div>
        <a href="tel:9152987821" className="btn-call-now" id="handoff-call-btn">📞 Call iCall Now</a>
        <div className="helpline-card" style={{ marginBottom: 20 }}>
          <p className="name">Vandrevala Foundation — 24/7</p>
          <p className="number">1860-2662-345</p>
          <p className="desc">Available any time, any day</p>
        </div>
        <div className="helpline-card" style={{ marginBottom: 20 }}>
          <p className="name">AASRA — 24/7</p>
          <p className="number">9820466627</p>
          <p className="desc">Suicide prevention helpline</p>
        </div>
        <button className="btn-close-modal" onClick={onClose} id="handoff-close-btn">
          Go back to Saathi
        </button>
      </div>
    </div>
  );
}

function BreathingWidget({ onClose }) {
  const PHASES = [
    { name: 'Breathe in', duration: 4, type: 'inhale', hint: 'slowly through your nose' },
    { name: 'Hold', duration: 7, type: 'hold', hint: 'gently' },
    { name: 'Breathe out', duration: 8, type: 'exhale', hint: 'slowly through your mouth' },
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [count, setCount] = useState(PHASES[0].duration);
  const timer = useRef(null);
  const TOTAL = 3;

  useEffect(() => {
    setCount(PHASES[phaseIdx].duration);
    timer.current = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer.current);
          const next = (phaseIdx + 1) % PHASES.length;
          if (next === 0) {
            const nc = cycle + 1;
            if (nc >= TOTAL) { setTimeout(onClose, 800); return 0; }
            setCycle(nc);
          }
          setPhaseIdx(next);
          return PHASES[next].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [phaseIdx, cycle]);

  const phase = PHASES[phaseIdx];
  const emojis = { inhale: '🌊', hold: '✨', exhale: '🍃' };

  return (
    <div className="breathing-widget" role="dialog">
      <div className="breathing-card">
        <h3>4-7-8 Breathing</h3>
        <p className="sub-text">A gentle way to calm your nervous system</p>
        <div className="breathing-circle-wrapper">
          <div className="breathing-ring" />
          <div className={`breathing-circle ${phase.type}`} key={`${phaseIdx}-${cycle}`}>
            <span style={{ fontSize: 32 }}>{emojis[phase.type]}</span>
          </div>
        </div>
        <div className="breathing-label">{count}</div>
        <div className="breathing-phase">{phase.name}</div>
        <p className="breathing-count">{phase.hint} · Cycle {cycle + 1} of {TOTAL}</p>
        <button className="btn-end-breathing" onClick={onClose} id="end-breathing-btn">
          I feel calmer now
        </button>
      </div>
    </div>
  );
}

// ─── Main Chat Component ────────────────────────────────────────────────────────
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user, isAnonymous, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [alertLevel, setAlertLevel] = useState('normal');
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const [showColdStart, setShowColdStart] = useState(false);
  const coldStartTimer = useRef(null);
  const initialized = useRef(false);

  const hasMessages = messages.length > 0;

  // Initialize empty state message
  useEffect(() => {
    if (!loading && messages.length === 0 && !initialized.current) {
      initialized.current = true;
      const greeting = (user && !isAnonymous && user.username)
        ? `Hey ${user.username}, good to see you again. How are you doing today?`
        : `Hey, I'm really glad you're here. This is your space — no pressure, no judgment. What's on your mind today?`;
      
      setMessages([{
        id: uid(),
        role: 'model',
        content: greeting,
        timestamp: new Date()
      }]);
    }
  }, [user, isAnonymous, loading, messages.length]);

  useEffect(() => {
    if (user && !isAnonymous) {
      fetch(`${API}/api/user/alert-level`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('saathi_token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.alertLevel === 'high') setAlertLevel('high');
      })
      .catch(() => {});
    }
  }, [user, isAnonymous]);

  // Lock body for chat layout
  useEffect(() => {
    document.body.classList.add('chat-mode');
    document.body.classList.remove('website-mode');
    return () => document.body.classList.remove('chat-mode');
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const resize = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; }
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (detectCrisis(trimmed)) setShowCrisis(true);

    const userMsg = { id: uid(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    setShowColdStart(false);

    coldStartTimer.current = setTimeout(() => {
      setShowColdStart(true);
    }, 3000);

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const assistantId = uid();
    let full = '';

    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });

      if (res.status === 401) throw new Error('401');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { id: assistantId, role: 'model', content: '', timestamp: new Date(), streaming: true }]);
      setIsTyping(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Clear the cold start loader as soon as the first chunk arrives
        if (coldStartTimer.current) {
          clearTimeout(coldStartTimer.current);
          setShowColdStart(false);
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'meta') {
              if (ev.isCrisis) setShowCrisis(true);
            } else if (ev.type === 'text') {
              full += ev.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: full } : m
              ));
            } else if (ev.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: "Something went wrong on our end — try again in a moment", streaming: false } : m
              ));
              return;
            } else if (ev.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, streaming: false } : m
              ));
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setIsTyping(false);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== assistantId);
        return [...filtered, {
          id: uid(), role: 'model',
          content: err.message === '401' ? "Your session expired — just log in again 🤎" : "Something went wrong on our end — try again in a moment",
          timestamp: new Date(),
        }];
      });
    } finally {
      if (coldStartTimer.current) {
        clearTimeout(coldStartTimer.current);
        setShowColdStart(false);
      }
      abortRef.current = null;
    }
  }, [messages, isTyping, user, isAnonymous]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  if (loading) {
    return (
      <div className="saathi-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="breathing-circle-wrapper" style={{ transform: 'scale(0.5)' }}>
          <div className="breathing-ring" />
          <div className="breathing-circle inhale"><span style={{ fontSize: 32 }}>✨</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="saathi-page chat-container">
      {/* ── Top Nav ── */}
      <nav className="saathi-nav" id="saathi-nav">
        <div className="nav-brand">
          <div className="nav-logo" aria-hidden="true">✨</div>
          <span className="nav-title">Saathi</span>
          <span className="nav-tagline">साथी</span>
        </div>
        <div className="nav-right">
          <div className="breathing-dot" aria-hidden="true" title="Always breathing with you" />
          <button
            className="btn-handoff"
            onClick={() => setShowHandoff(true)}
            id="talk-to-human-btn"
          >
            <span>🤝</span>
            <span>Real person</span>
          </button>
        </div>
      </nav>

      {/* ── High Alert Banner ── */}
      {alertLevel === 'high' && (
        <div className="alert-banner" role="alert">
          <p>You've been going through a lot lately. A real person is ready to talk right now.</p>
          <button className="btn-alert-call" onClick={() => setShowHandoff(true)}>Connect</button>
        </div>
      )}

      {/* ── Crisis Banner ── */}
      {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} />}

      {/* ── Main Area ── */}
      <main className="saathi-main" id="saathi-main">
        {!hasMessages ? (
          /* Welcome state — shown before first message */
          <div className="welcome-screen">
            <div className="welcome-glow" aria-hidden="true" />
            <div className="welcome-emoji">🌿</div>
            <h1 className="welcome-heading">
              Whatever you're carrying right now —<br />
              <em>you don't have to carry it alone.</em>
            </h1>
            <p className="welcome-sub">
              Saathi listens without judgment. No sign-up. No history saved.
              Just a warm presence, whenever you need it.
            </p>
            <div className="welcome-features">
              {FEATURES.map(f => (
                <div key={f.label} className="feat-pill">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
            <p className="starter-label">Start with something, or just say hi —</p>
            <div className="starter-chips">
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  className="starter-chip"
                  id={`starter-${i}`}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message list */
          <div
            className="messages-list"
            id="messages-list"
            role="log"
            aria-live="polite"
            aria-label="Conversation with Saathi"
          >
            <div className="messages-padding-top" />
            {messages.map(m => <Bubble key={m.id} msg={m} />)}
            {isTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ai-avatar" aria-hidden="true">✨</div>
                  <TypingDots />
                </div>
                {showColdStart && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    style={{ marginLeft: 38, fontSize: 13, color: 'var(--text-3)' }}
                  >
                    Saathi is waking up, just a moment... 🤎
                  </motion.div>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* ── Input Bar ── */}
      <div className="saathi-input-bar">
        {hasMessages && (
          <div className="input-context-label">
            <span className="breathing-dot small" aria-hidden="true" />
            <span>Saathi is here with you</span>
          </div>
        )}
        <div className="input-wrapper" id="input-wrapper">
          <textarea
            ref={textareaRef}
            id="message-input"
            className="message-input"
            placeholder="Say whatever's on your mind…"
            value={input}
            rows={1}
            disabled={isTyping}
            onChange={e => { setInput(e.target.value); resize(); }}
            onKeyDown={handleKey}
            aria-label="Type your message to Saathi"
            autoComplete="off"
            spellCheck
          />
          <button
            className="btn-send"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            id="send-btn"
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="input-footer-note">
          🔒 End-to-end encrypted · Anonymous · No conversation is ever stored
        </p>
      </div>

      {/* ── Modals ── */}
      {showHandoff && <HandoffModal onClose={() => setShowHandoff(false)} />}
      {showBreathing && <BreathingWidget onClose={() => setShowBreathing(false)} />}
    </div>
  );
}
