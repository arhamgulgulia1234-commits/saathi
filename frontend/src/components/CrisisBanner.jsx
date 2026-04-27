export default function CrisisBanner({ onDismiss }) {
  return (
    <div className="crisis-banner" role="alert" aria-live="assertive">
      <div className="crisis-text">
        <span>💜</span>
        <p>
          <strong>You don't have to face this alone.</strong>{' '}
          A real person is here for you right now.
        </p>
      </div>
      <div className="crisis-actions">
        <a
          href="tel:9152987821"
          className="btn-call"
          id="crisis-call-btn"
          aria-label="Call iCall helpline now"
        >
          <span>📞</span>
          <span>Call Now</span>
        </a>
        <button
          className="btn-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss crisis banner"
          id="crisis-dismiss-btn"
        >
          ×
        </button>
      </div>
    </div>
  );
}
