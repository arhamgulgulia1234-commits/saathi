import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '';

function Toggle({ id, checked, onChange, disabled }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`consent-toggle ${checked ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
      type="button"
    >
      <span className="consent-toggle-thumb" />
    </button>
  );
}

export default function ConsentScreen({ onComplete }) {
  const { token } = useAuth();
  const [memory, setMemory]     = useState(true);
  const [training, setTraining] = useState(false);
  const [age, setAge]           = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const canContinue = age;

  const handleSubmit = async () => {
    if (!canContinue) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/user/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memoryEnabled:   memory,
          trainingEnabled: training,
          ageConfirmed:    age,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onComplete();
    } catch (e) {
      setError('Something went wrong saving your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      id: 'consent-memory',
      emoji: '🧠',
      label: 'Remember my conversations',
      description:
        'Saathi will remember what you\'ve shared across sessions to give you more personal, consistent support. Your conversations are stored encrypted and only you can access them.',
      badge: 'Recommended',
      badgeClass: 'badge-recommended',
      checked: memory,
      onChange: setMemory,
      required: false,
    },
    {
      id: 'consent-training',
      emoji: '🌱',
      label: 'Help make Saathi better',
      description:
        'Allow your anonymized conversations to help train Saathi to be more helpful for everyone. All personal details are completely removed before any data is used. You can withdraw this anytime.',
      badge: 'Optional',
      badgeClass: 'badge-optional',
      checked: training,
      onChange: setTraining,
      required: false,
    },
    {
      id: 'consent-age',
      emoji: '✋',
      label: 'I am 18 years of age or older',
      description:
        'If you are under 18, Saathi can still support you but we recommend telling a trusted adult about how you\'re feeling.',
      badge: 'Required to continue',
      badgeClass: 'badge-required',
      checked: age,
      onChange: setAge,
      required: true,
    },
  ];

  return (
    <div className="modal-overlay consent-overlay" style={{ zIndex: 1100 }}>
      <motion.div
        className="consent-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Header */}
        <div className="consent-header">
          <div className="consent-logo" aria-hidden="true">✨</div>
          <h2 className="consent-title">Before we begin —</h2>
          <p className="consent-subtitle">a few honest things</p>
        </div>

        {/* Toggles */}
        <div className="consent-items">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className={`consent-item ${item.required && !item.checked ? 'consent-item-pending' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.35 }}
            >
              <div className="consent-item-top">
                <div className="consent-item-left">
                  <span className="consent-item-emoji" aria-hidden="true">{item.emoji}</span>
                  <div>
                    <div className="consent-item-label-row">
                      <span className="consent-item-label">{item.label}</span>
                      <span className={`consent-badge ${item.badgeClass}`}>{item.badge}</span>
                    </div>
                    <p className="consent-item-desc">{item.description}</p>
                  </div>
                </div>
                <Toggle
                  id={item.id}
                  checked={item.checked}
                  onChange={item.onChange}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Change notice */}
        <p className="consent-change-note">
          You can change any of these at any time in your <strong>Profile settings</strong>.
        </p>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="soft-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <button
          className={`btn-auth-main consent-continue ${!canContinue ? 'consent-continue-disabled' : ''}`}
          onClick={handleSubmit}
          disabled={!canContinue || saving}
          id="consent-continue-btn"
        >
          {saving ? 'Saving...' : canContinue ? 'Continue to Saathi 💜' : 'Please confirm your age to continue'}
        </button>

        {/* Terms note */}
        <p className="consent-terms-note">
          By continuing you agree to our{' '}
          <a href="/terms" className="auth-consent-link">Terms & Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  );
}
