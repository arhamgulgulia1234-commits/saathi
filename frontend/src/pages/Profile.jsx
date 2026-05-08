import { useState, useEffect, useCallback } from 'react';
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
      disabled={disabled}
    >
      <span className="consent-toggle-thumb" />
    </button>
  );
}

export default function Profile() {
  const { user, isAnonymous, token, logout } = useAuth();
  const [stats, setStats]                   = useState({ totalSessions: 0, memberSince: '' });
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingContact, setSavingContact]   = useState(false);

  // Consent state
  const [consent, setConsent]               = useState({ memoryEnabled: true, trainingEnabled: false, ageConfirmed: false });
  const [savingConsent, setSavingConsent]   = useState(false);
  const [consentSaved, setConsentSaved]     = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]       = useState('');
  const [deleting, setDeleting]             = useState(false);
  const [deleteMessage, setDeleteMessage]   = useState('');

  // Load existing consent + stats
  useEffect(() => {
    if (!user || !token) return;
    setEmergencyContact(user.emergencyContact || '');
    setStats(prev => ({
      ...prev,
      memberSince: new Date(user.createdAt || Date.now())
        .toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    }));

    fetch(`${API}/api/mood/insights`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(prev => ({ ...prev, totalSessions: d.totalSessions || 0 })))
      .catch(() => {});

    fetch(`${API}/api/user/consent`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.consent) setConsent(d.consent); })
      .catch(() => {});
  }, [user, token]);

  // Save consent toggle change
  const handleConsentChange = useCallback(async (field, value) => {
    setConsent(prev => ({ ...prev, [field]: value }));
    setSavingConsent(true);
    setConsentSaved(false);
    try {
      await fetch(`${API}/api/user/consent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      setConsentSaved(true);
      setTimeout(() => setConsentSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConsent(false);
    }
  }, [token]);

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await fetch(`${API}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emergencyContact }),
      });
    } catch (e) { /* no-op */ }
    setTimeout(() => setSavingContact(false), 800);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/user/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      
      setDeleteMessage(data.message || "Everything is gone. Take care of yourself 💜");
      // Clear local storage then wait before logging out
      ['saathi_token', 'saathi_landing_seen'].forEach(k => localStorage.removeItem(k));
      Object.keys(localStorage).filter(k => k.startsWith('saathi_')).forEach(k => localStorage.removeItem(k));
      setTimeout(() => logout(), 3000);
    } catch (e) {
      setDeleteMessage("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const consentItems = [
    {
      id: 'profile-memory',
      field: 'memoryEnabled',
      emoji: '🧠',
      label: 'Remember my conversations',
      description: 'Saathi remembers what you share across sessions to give more personal support. Turn off to disable memory going forward.',
      badge: 'Recommended',
      badgeClass: 'badge-recommended',
    },
    {
      id: 'profile-training',
      field: 'trainingEnabled',
      emoji: '🌱',
      label: 'Help make Saathi better',
      description: "Your anonymized conversations help train Saathi. Turning this off immediately excludes all your past and future conversations from training. We won't re-include them even if you turn it back on.",
      badge: 'Optional',
      badgeClass: 'badge-optional',
    },
    {
      id: 'profile-age',
      field: 'ageConfirmed',
      emoji: '✋',
      label: 'I am 18 years of age or older',
      description: 'Required to use Saathi. This cannot be turned off.',
      badge: 'Required',
      badgeClass: 'badge-required',
    },
  ];

  if (isAnonymous) {
    return (
      <div className="profile-page anonymous-state">
        <div className="card">
          <h2>Profile 👤</h2>
          <p>You are using Saathi anonymously.</p>
          <button className="btn-auth-main" style={{ marginTop: '16px' }} onClick={logout}>
            Create an Account / Login
          </button>
        </div>
      </div>
    );
  }

  if (deleteMessage) {
    return (
      <div className="profile-page" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <motion.div
          className="consent-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '48px 32px' }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>💜</div>
          <p style={{ color: 'var(--text-1)', fontSize: 16, lineHeight: 1.7 }}>{deleteMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        <h2>{user?.username}</h2>
        <p>{user?.email}</p>
        <span className="member-badge">Member since {stats.memberSince}</span>
      </div>

      <div className="profile-sections">
        {/* Stats */}
        <div className="profile-section">
          <h3>Your Journey</h3>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-value">{stats.totalSessions}</span>
              <span className="stat-label">Sessions</span>
            </div>
          </div>
        </div>

        {/* Privacy & Consent */}
        <div className="profile-section">
          <div className="profile-section-header-row">
            <h3>Privacy & Consent</h3>
            <AnimatePresence>
              {(savingConsent || consentSaved) && (
                <motion.span
                  className="consent-saved-badge"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {savingConsent ? 'Saving…' : '✓ Saved'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="section-desc">Change any of these at any time. Your choices take effect immediately.</p>

          <div className="profile-consent-items">
            {consentItems.map(item => (
              <div key={item.id} className="profile-consent-item">
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
                    checked={!!consent[item.field]}
                    onChange={v => handleConsentChange(item.field, v)}
                    disabled={item.field === 'ageConfirmed'} // age confirmation is locked
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="profile-section">
          <h3>Emergency Contact</h3>
          <p className="section-desc">Someone we can quietly reach out to if we're ever really worried about you. Completely optional.</p>
          <div className="input-group-row">
            <input
              type="email"
              placeholder="Trusted person's email"
              value={emergencyContact}
              onChange={e => setEmergencyContact(e.target.value)}
              className="profile-input"
            />
            <button onClick={handleSaveContact} className="btn-save-sm" disabled={savingContact}>
              {savingContact ? '✓' : 'Save'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-section profile-danger-zone">
          <h3>Delete Account</h3>
          <p className="section-desc">
            This will permanently delete your account, all messages, conversations, journal entries, and mood data. There is no undo.
          </p>

          <AnimatePresence>
            {!showDeleteConfirm ? (
              <motion.button
                key="show-delete"
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Delete my account
              </motion.button>
            ) : (
              <motion.div
                key="delete-confirm"
                className="delete-confirm-box"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="delete-confirm-label">
                  Type <strong>delete</strong> to confirm. This cannot be undone.
                </p>
                <div className="input-group-row">
                  <input
                    type="text"
                    placeholder="delete"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    className="profile-input"
                    autoComplete="off"
                  />
                  <button
                    className="btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={deleteInput.trim().toLowerCase() !== 'delete' || deleting}
                  >
                    {deleting ? 'Deleting…' : 'Confirm'}
                  </button>
                </div>
                <button
                  className="btn-outline"
                  style={{ marginTop: 8 }}
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="btn-logout" onClick={logout}>Log out</button>
      </div>
    </motion.div>
  );
}
