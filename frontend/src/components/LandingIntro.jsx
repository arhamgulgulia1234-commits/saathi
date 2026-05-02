import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingIntro({ onComplete }) {
  const [screen, setScreen] = useState(1);

  const handleNext = () => {
    if (screen === 1) {
      setScreen(2);
    } else {
      localStorage.setItem('saathi_landing_seen', 'true');
      onComplete();
    }
  };

  return (
    <div className="landing-intro-overlay">
      <AnimatePresence mode="wait">
        {screen === 1 && (
          <motion.div 
            key="screen1"
            className="landing-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="landing-logo" aria-hidden="true">✨</div>
            <h1 className="landing-title">Saathi</h1>
            <p className="landing-tagline">
              A safe space to talk.<br/>
              No judgment.<br/>
              No data sold. Ever.
            </p>
            <button className="btn-auth-main landing-btn" onClick={handleNext}>
              Enter your safe space
            </button>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div 
            key="screen2"
            className="landing-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className="landing-subtitle">Why Saathi?</h2>
            <div className="trust-points">
              <div className="trust-point">
                <span className="icon">🔒</span>
                <span>End-to-end encrypted</span>
              </div>
              <div className="trust-point">
                <span className="icon">👤</span>
                <span>Anonymous by default</span>
              </div>
              <div className="trust-point">
                <span className="icon">🤎</span>
                <span>Real human available if you need</span>
              </div>
            </div>
            <button className="btn-auth-main landing-btn" onClick={handleNext}>
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
