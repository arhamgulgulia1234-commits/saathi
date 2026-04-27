import { useState } from 'react';

export default function NicknamePrompt({ onComplete }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(name.trim() || null);
  };

  return (
    <div className="nickname-overlay">
      <div className="nickname-card">
        <span className="emoji">🌙</span>
        <h2>Hey, it's just us here.</h2>
        <p>
          You don't need an account. You don't need to explain anything.
          What would you like me to call you?
        </p>

        <form className="nickname-input-group" onSubmit={handleSubmit}>
          <input
            id="nickname-input"
            className="nickname-input"
            type="text"
            placeholder="a name, nickname, or nothing at all..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="btn-primary" id="nickname-submit-btn">
            {name.trim() ? `Let's talk, ${name.trim()}` : "Let's talk"}
          </button>
          <button
            type="button"
            className="skip-link"
            onClick={() => onComplete(null)}
            id="nickname-skip-btn"
          >
            Stay anonymous
          </button>
        </form>
      </div>
    </div>
  );
}
