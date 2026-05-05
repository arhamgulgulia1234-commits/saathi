import { useState } from 'react';
import { motion } from 'framer-motion';

const CONTEXTS = [
  { id: 'love', emoji: '💔', title: 'Love & Relationships', desc: 'Heartbreak, loneliness, or feeling disconnected' },
  { id: 'family', emoji: '👨‍👩‍👧', title: 'Family', desc: 'Arguments, pressure, or feeling misunderstood at home' },
  { id: 'career', emoji: '💼', title: 'Career & Studies', desc: 'Exams, work stress, or feeling lost about the future' },
  { id: 'anxiety', emoji: '😔', title: 'Anxiety & Overthinking', desc: 'Racing thoughts, worry, or can\'t seem to relax' },
  { id: 'low', emoji: '😶', title: 'Just Feeling Low', desc: 'No specific reason — just heavy, empty, or numb' },
  { id: 'other', emoji: '💬', title: 'Something Else', desc: 'I\'ll tell Saathi directly' }
];

export default function ContextSelector({ onSelect, loading }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="context-selector">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="context-header"
      >
        <h1 className="welcome-heading" style={{ marginBottom: '8px' }}>
          What's been weighing on you lately?
        </h1>
        <p className="welcome-sub" style={{ marginBottom: '32px' }}>
          This helps Saathi understand you better. You can talk about anything — this is just a starting point.
        </p>
      </motion.div>

      <motion.div 
        className="context-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {CONTEXTS.map(ctx => (
          <button
            key={ctx.id}
            className={`context-card ${selected === ctx.id ? 'selected' : ''}`}
            onClick={() => setSelected(ctx.id)}
            disabled={loading}
          >
            <div className="context-emoji">{ctx.emoji}</div>
            <div className="context-info">
              <span className="context-title">{ctx.title}</span>
              <span className="context-desc">{ctx.desc}</span>
            </div>
          </button>
        ))}
      </motion.div>

      {selected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="context-footer"
        >
          <button 
            className="btn-auth-main" 
            style={{ marginTop: '32px', minWidth: '200px' }}
            onClick={() => onSelect(selected)}
            disabled={loading}
          >
            {loading ? 'Just a moment...' : 'Start talking'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
