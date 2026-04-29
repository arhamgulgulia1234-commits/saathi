import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, token, isAnonymous } = useAuth();
  const [insights, setInsights] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);

  const API = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (isAnonymous) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, isAnonymous]);

  const fetchData = async () => {
    try {
      const [insRes, histRes] = await Promise.all([
        fetch(`${API}/api/mood/insights`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/mood/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (insRes.ok) setInsights(await insRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (score) => {
    try {
      const res = await fetch(`${API}/api/mood/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score, note: 'Daily check-in' })
      });
      if (res.ok) {
        setCheckedIn(true);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isAnonymous) {
    return (
      <div className="dashboard-page anonymous-state">
        <div className="card">
          <h2>Mood Tracking 📊</h2>
          <p>You're currently using Saathi anonymously.</p>
          <p>To see your mood trends over time and get insights, create a private account.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="dashboard-page loading">Loading your space...</div>;

  const chartData = history.map(h => ({
    date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: h.score
  }));

  const emojis = [
    { score: 2, icon: '😔', label: 'Heavy' },
    { score: 4, icon: '😟', label: 'Rough' },
    { score: 5, icon: '😐', label: 'Okay' },
    { score: 7, icon: '🙂', label: 'Good' },
    { score: 9, icon: '😊', label: 'Great' }
  ];

  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="dashboard-header">
        <h2>Your Space</h2>
        <p>Welcome back, {user?.username}.</p>
      </div>

      {!checkedIn && (
        <div className="checkin-widget">
          <h3>How are you feeling right now?</h3>
          <div className="emoji-row">
            {emojis.map(e => (
              <button key={e.score} onClick={() => handleCheckIn(e.score)} title={e.label}>
                {e.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="insights-grid">
        <div className="insight-card">
          <span className="label">Average Mood</span>
          <span className="value">{insights?.averageMood || '-'} <span className="sub">/ 10</span></span>
        </div>
        <div className="insight-card">
          <span className="label">Trend</span>
          <span className="value" style={{ textTransform: 'capitalize' }}>{insights?.trend || '-'}</span>
        </div>
        <div className="insight-card">
          <span className="label">Total Sessions</span>
          <span className="value">{insights?.totalSessions || 0}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="chart-container">
          <h3>Recent Mood</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#8a80a8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a80a8" fontSize={12} tickLine={false} axisLine={false} domain={[1, 10]} />
                <Tooltip 
                  contentStyle={{ background: '#1e2840', border: '1px solid rgba(185,165,232,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#c5b0f5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#9d87d4" 
                  strokeWidth={3} 
                  dot={{ fill: '#7c68b8', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: '#ddd0ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {insights?.mostFrequentEmotions?.length > 0 && (
        <div className="emotions-container">
          <h3>Lately, you've been feeling...</h3>
          <div className="emotion-tags">
            {insights.mostFrequentEmotions.map((em, i) => (
              <span key={i} className="emotion-tag">{em}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
