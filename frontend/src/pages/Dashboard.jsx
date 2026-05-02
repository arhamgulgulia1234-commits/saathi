import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, token, isAnonymous } = useAuth();
  const [insights, setInsights] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedPeriods, setCompletedPeriods] = useState([]);

  const API = import.meta.env.VITE_API_URL || '';

  // Initialize from localStorage to avoid flashing
  useEffect(() => {
    if (user) {
      const cached = JSON.parse(localStorage.getItem(`saathi_checkin_${user.email}`) || 'null');
      if (cached && cached.date === new Date().toDateString()) {
        setCompletedPeriods(prev => [...new Set([...prev, cached.period])]);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isAnonymous) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, isAnonymous]);

  const fetchData = async () => {
    try {
      const [insRes, histRes, todayRes] = await Promise.all([
        fetch(`${API}/api/mood/insights`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/mood/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/mood/today`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (insRes.ok) setInsights(await insRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setCompletedPeriods(todayData.completedPeriods || []);
      }
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
        const data = await res.json();
        setCompletedPeriods(prev => [...prev, data.period]);
        localStorage.setItem(`saathi_checkin_${user.email}`, JSON.stringify({
          date: new Date().toDateString(),
          period: data.period
        }));
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

  const hour = new Date().getHours();
  const currentPeriod = (hour >= 0 && hour < 12) ? 'morning' : 'evening';
  const isCurrentPeriodDone = completedPeriods.includes(currentPeriod);
  const isBothDone = completedPeriods.includes('morning') && completedPeriods.includes('evening');
  const hoursToNextPeriod = currentPeriod === 'morning' ? 12 - hour : 24 - hour;

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

      {isBothDone ? (
        <div className="checkin-widget" style={{ textAlign: 'center' }}>
          <h3>You've checked in twice today 🤎</h3>
          <p style={{ color: 'var(--text-2)' }}>See you tomorrow.</p>
        </div>
      ) : isCurrentPeriodDone ? (
        <div className="checkin-widget" style={{ textAlign: 'center' }}>
          <h3>{currentPeriod === 'morning' ? 'Morning' : 'Evening'} check-in complete 🤎</h3>
          <p style={{ color: 'var(--text-2)' }}>Next check-in available in {hoursToNextPeriod} hour{hoursToNextPeriod > 1 ? 's' : ''}.</p>
        </div>
      ) : (
        <div className="checkin-widget">
          <h3>How are you feeling this {currentPeriod}?</h3>
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
                <XAxis dataKey="date" stroke="#8A7A70" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8A7A70" fontSize={12} tickLine={false} axisLine={false} domain={[1, 10]} />
                <Tooltip 
                  contentStyle={{ background: '#161210', border: '1px solid #2A2320', borderRadius: '8px' }}
                  itemStyle={{ color: '#F0E6DC' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#D4845A" 
                  strokeWidth={3} 
                  dot={{ fill: '#5C3D2E', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, fill: '#D4845A' }}
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
