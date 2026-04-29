import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding({ onComplete }) {
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);

  const API = import.meta.env.VITE_API_URL || '';

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else finishOnboarding();
  };

  const finishOnboarding = async () => {
    if (emergencyContact.trim()) {
      setSaving(true);
      try {
        // Mock save for now since we haven't built the user update endpoint
        // await fetch(`${API}/api/user/profile`, { ... })
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem(`saathi_onboarded_${user?.email}`, 'true');
    onComplete();
  };

  const skip = () => {
    localStorage.setItem(`saathi_onboarded_${user?.email}`, 'true');
    onComplete();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          className="modal-card onboarding-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <>
              <div className="onboarding-icon">🔒</div>
              <h3>Saathi is your safe space.</h3>
              <p className="sub">Everything here is private and end-to-end encrypted. We cannot read your journal or messages.</p>
              <button className="btn-auth-main" onClick={handleNext}>I understand</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="onboarding-icon">🌿</div>
              <h3>We'll gently check in with you.</h3>
              <p className="sub">You can always ignore us, no pressure. We just want to make sure you're doing okay.</p>
              <button className="btn-auth-main" onClick={handleNext}>Sounds good</button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="onboarding-icon">🤝</div>
              <h3>Want to add a trusted person?</h3>
              <p className="sub">Add an email of someone we can quietly reach out to if we're ever really worried about you. Completely optional.</p>
              <input 
                type="email" 
                placeholder="Trusted person's email" 
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(196, 113, 74, 0.3)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  marginBottom: '16px'
                }}
              />
              <button className="btn-auth-main" onClick={finishOnboarding} disabled={saving}>
                {saving ? 'Saving...' : 'Finish Setup'}
              </button>
              <button className="btn-anonymous" onClick={skip} style={{ marginTop: '8px' }}>
                Skip for now
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
