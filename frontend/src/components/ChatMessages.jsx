import { useRef, useEffect, memo } from 'react';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubble = memo(({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  return (
    <div className={`message-group ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-bubble">
        {message.content}
        {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
      </div>
      {!isStreaming && (
        <span className="message-time">
          {formatTime(message.timestamp || new Date())}
        </span>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = () => (
  <div className="typing-indicator" aria-label="Saathi is typing">
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

const STARTER_PROMPTS = [
  "I've been feeling really low lately",
  "I can't sleep and my mind won't stop",
  "I just need someone to talk to",
  "I'm feeling overwhelmed",
  "I don't know what's wrong with me",
];

export default function ChatMessages({ messages, isTyping, nickname, onStarterClick }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showWelcome = messages.length === 0 && !isTyping;

  return (
    <div
      className="messages-container"
      id="messages-container"
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      {showWelcome ? (
        <div className="welcome-state">
          <div className="welcome-icon">🌿</div>
          <h2>
            {nickname ? `${nickname}, I'm here.` : "Whatever you're carrying, I'm here."}
          </h2>
          <p>
            No judgment. No rush. Just someone to talk to. Start wherever feels right.
          </p>
          <div className="starter-chips">
            {STARTER_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                className="starter-chip"
                onClick={() => onStarterClick(prompt)}
                id={`starter-chip-${i}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
