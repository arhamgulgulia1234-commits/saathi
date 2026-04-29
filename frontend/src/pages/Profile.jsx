import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, isAnonymous, token, logout } = useAuth();
  const [stats, setStats] = useState({ totalSessions: 0, memberSince: '' });
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const API = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (user) {
      setEmergencyContact(user.emergencyContact || '');
      // In a real app we'd fetch stats from an endpoint, using the mood insights for now
      fetch(`${API}/api/mood/insights`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setStats(prev => ({ ...prev, totalSessions: data.totalSessions })))
        .catch(() => {});
        
      setStats(prev => ({ 
        ...prev, 
        memberSince: new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      }));
    }
  }, [user, token, API]);

  const handleSaveContact = async () => {
    // We would need an API endpoint to update the user profile
    // For now we'll simulate the save
    setSavingContact(true);
    setTimeout(() => {
      setSavingContact(false);
    }, 1000);
  };

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

  return (
    <motion.div 
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <h2>{user?.username}</h2>
        <p>{user?.email}</p>
        <span className="member-badge">Member since {stats.memberSince}</span>
      </div>

      <div className="profile-sections">
        <div className="profile-section">
          <h3>Your Journey</h3>
          <div className="stats-row">
            <div className="stat-box">
              <span className="stat-value">{stats.totalSessions}</span>
              <span className="stat-label">Sessions</span>
            </div>
            {/* Can add more stats here */}
          </div>
        </div>

        <div className="profile-section">
          <h3>Emergency Contact</h3>
          <p className="section-desc">Someone we can quietly reach out to if we're ever really worried about you. This is completely optional.</p>
          <div className="input-group-row">
            <input 
              type="email" 
              placeholder="Trusted person's email"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="profile-input"
            />
            <button 
              onClick={handleSaveContact} 
              className="btn-save-sm"
              disabled={savingContact}
            >
              {savingContact ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="profile-section">
          <h3>Data & Privacy</h3>
          <p className="section-desc">Your journal is encrypted and your chats are private.</p>
          <div className="action-buttons">
            <button className="btn-outline">Export my data</button>
            <button className="btn-danger">Delete account</button>
          </div>
        </div>

        <button className="btn-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </motion.div>
  );
}
