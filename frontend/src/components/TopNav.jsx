import { useNavigate } from 'react-router-dom';

/**
 * TopNav — shown on all secondary pages (Mood, Journal, Profile).
 * Hidden on desktop where the sidebar already provides navigation.
 */
export default function TopNav({ title }) {
  const navigate = useNavigate();
  return (
    <div className="top-nav">
      <button className="top-nav-brand" onClick={() => navigate('/')}>
        ✦ Saathi
      </button>
      <span className="top-nav-title">{title}</span>
      {/* Spacer keeps title truly centered */}
      <span className="top-nav-spacer" />
    </div>
  );
}
