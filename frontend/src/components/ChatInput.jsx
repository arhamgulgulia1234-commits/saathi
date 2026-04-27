import { useState, useRef, useCallback } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    autoResize();
  };

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, disabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          id="message-input"
          className="message-input"
          placeholder="Say anything that's on your mind..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
          aria-label="Type your message"
          autoComplete="off"
          spellCheck="true"
        />
        <button
          className="btn-send"
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
          id="send-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 12H19M19 12L13 6M19 12L13 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="input-footer">
        <span className="lock-icon">🔒</span>
        <p>End-to-end encrypted · Anonymous · No data stored</p>
      </div>
    </div>
  );
}
