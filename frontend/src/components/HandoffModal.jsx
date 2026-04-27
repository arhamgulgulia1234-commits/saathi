export default function HandoffModal({ onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="handoff-title" aria-modal="true">
      <div className="modal-card">
        <h3 id="handoff-title">Talk to a real person 💜</h3>
        <p className="sub">
          Sometimes words on a screen aren't enough. These are trained, caring humans
          who want to listen — for free.
        </p>

        <div className="helpline-card">
          <p className="name">iCall — India</p>
          <p className="number">9152987821</p>
          <p className="desc">Mon–Sat, 8am–10pm · Free & confidential</p>
        </div>

        <a
          href="tel:9152987821"
          className="btn-call-now"
          id="handoff-call-btn"
          aria-label="Call iCall helpline 9152987821"
        >
          <span>📞</span>
          <span>Call iCall Now</span>
        </a>

        <div className="helpline-card" style={{ marginBottom: '20px' }}>
          <p className="name">Vandrevala Foundation — 24/7</p>
          <p className="number">1860-2662-345</p>
          <p className="desc">Available 24 hours, any day</p>
        </div>

        <button
          className="btn-close-modal"
          onClick={onClose}
          id="handoff-close-btn"
        >
          Go back to Saathi
        </button>
      </div>
    </div>
  );
}
