import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    emoji: '💜',
    title: 'What Saathi is',
    body: `Saathi is an emotional support companion. It is not a licensed therapist, psychologist, or medical professional. It is not a substitute for professional mental health care.

If you are going through a crisis, please reach out to a real person. iCall is free and confidential — you can call them at 9152987821 (Monday to Saturday, 8am–10pm).`
  },
  {
    emoji: '🔒',
    title: 'What we collect',
    body: `If you create an account: your username, email, and encrypted password.

If you give consent: anonymized summaries of your conversations to personalize your experience over time.

We never collect your real name, phone number, or location. We never sell your data. Ever.

Anonymous users leave no trace — no account, no history, nothing stored.`
  },
  {
    emoji: '🌱',
    title: 'How we use your data',
    body: `To remember your conversation history and make Saathi more helpful to you over time.

With your separate, explicit consent only: to improve Saathi's AI using fully anonymized data. You will always be asked before this happens. Saying no changes nothing about your experience.`
  },
  {
    emoji: '✋',
    title: 'Your rights',
    body: `You can delete your account and all associated data at any time from your Profile page.

You can withdraw any consent at any time — no questions asked.

You can export your data by contacting us. We will respond within 7 days.`
  },
  {
    emoji: '🚨',
    title: 'Crisis disclaimer',
    body: `If you are in immediate danger, please call emergency services at 112.

Saathi is not an emergency service. It cannot call for help. In a life-threatening situation, please close this app and call 112 immediately.`
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45 }
  })
};

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-glow" aria-hidden="true" />

      {/* Back button */}
      <motion.button
        className="terms-back-btn"
        onClick={() => navigate(-1)}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Go back"
      >
        ← Back
      </motion.button>

      <motion.div
        className="terms-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="terms-header">
          <div className="terms-logo" aria-hidden="true">✨</div>
          <h1 className="terms-title">Terms & Privacy</h1>
          <p className="terms-subtitle">
            Written in plain language — because you deserve to understand what you're agreeing to.
          </p>
          <p className="terms-updated">Last updated: May 2025</p>
        </div>

        {/* Sections */}
        <div className="terms-sections">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className="terms-section"
              custom={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
            >
              <div className="terms-section-header">
                <span className="terms-emoji" aria-hidden="true">{section.emoji}</span>
                <h2 className="terms-section-title">{section.title}</h2>
              </div>
              <div className="terms-section-body">
                {section.body.split('\n\n').map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          className="terms-footer-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p>
            Questions about your data or this policy?{' '}
            <a href="mailto:hello@saathi.app" className="terms-link">hello@saathi.app</a>
          </p>
          <p className="terms-tagline">Saathi — your safe space. Always. 💜</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
