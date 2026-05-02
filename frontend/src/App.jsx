import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, BarChart2, Book, User as UserIcon } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import Onboarding from './components/Onboarding';
import LandingIntro from './components/LandingIntro';

export default function App() {
  const { user, isAnonymous, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLandingIntro, setShowLandingIntro] = useState(false);

  useEffect(() => {
    // Check for landing intro before anything else if not logged in
    if (!user && !isAnonymous && !loading) {
      const seenLanding = localStorage.getItem('saathi_landing_seen');
      if (!seenLanding) {
        setShowLandingIntro(true);
      }
    }

    if (user && !isAnonymous) {
      const onboarded = localStorage.getItem(`saathi_onboarded_${user.email}`);
      if (!onboarded) {
        setShowOnboarding(true);
      }
    }
  }, [user, isAnonymous, loading]);

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

  if (showLandingIntro) {
    return <LandingIntro onComplete={() => setShowLandingIntro(false)} />;
  }

  if (!user && !isAnonymous) {
    return <AuthPage />;
  }

  const tabs = [
    { path: '/', icon: MessageSquare, label: 'Chat' },
    { path: '/mood', icon: BarChart2, label: 'Mood' },
    { path: '/journal', icon: Book, label: 'Journal' },
    { path: '/profile', icon: UserIcon, label: 'Profile' }
  ];

  return (
    <div className="app-container">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/mood" element={<Dashboard />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <Icon size={24} className="nav-icon" />
              <span className="nav-label">{tab.label}</span>
              {isActive && <span className="nav-glow" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
