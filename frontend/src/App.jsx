import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Onboarding from './components/Onboarding';
import ConsentScreen from './components/ConsentScreen';
import LandingIntro from './components/LandingIntro';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

export default function App() {
  const { user, isAnonymous, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showLandingIntro, setShowLandingIntro] = useState(false);

  useEffect(() => {
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
      } else {
        const consentDone = localStorage.getItem(`saathi_consent_${user.email}`);
        if (!consentDone) {
          setShowConsent(true);
        }
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
    return (
      <>
        <Routes>
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="app-container">
      {showOnboarding && (
        <Onboarding onComplete={() => {
          setShowOnboarding(false);
          const consentDone = localStorage.getItem(`saathi_consent_${user?.email}`);
          if (!consentDone) setShowConsent(true);
        }} />
      )}
      {showConsent && (
        <ConsentScreen onComplete={() => {
          localStorage.setItem(`saathi_consent_${user?.email}`, 'true');
          setShowConsent(false);
        }} />
      )}
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/mood" element={<Dashboard />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <MobileNav />
    </div>
  );
}
