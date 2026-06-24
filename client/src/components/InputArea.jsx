import { useRef, useEffect } from 'react';

export default function InputArea({ input, setInput, onSend, onKeyDown, onVoice, listening, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={ref}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask NutriBot anything about nutrition, diet, or meal planning…"
          disabled={disabled}
        />
        <div className="input-actions">
          <button
            className={`icon-btn voice-btn ${listening ? 'listening' : ''}`}
            onClick={onVoice}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            {listening ? '🔴' : '🎤'}
          </button>
          <button
            className="send-btn"
            onClick={() => onSend()}
            disabled={disabled || !input.trim()}
            title="Send"
          >
            ➤
          </button>
        </div>
      </div>
      <p className="input-hint">
        Press <strong>Enter</strong> to send · <strong>Shift+Enter</strong> for new line · 🎤 for voice
      </p>
    </div>
  );
}
