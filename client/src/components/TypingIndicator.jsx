export default function TypingIndicator() {
  return (
    <div className="message-row bot">
      <div className="avatar bot">🥗</div>
      <div className="typing-indicator">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
