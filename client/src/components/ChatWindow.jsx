import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const SUGGESTIONS = [
  { icon: '🧮', label: 'Calculate BMR', desc: 'BMR & daily calorie needs', prompt: 'Calculate BMR and TDEE for a 30-year-old woman, 65 kg, 165 cm, moderately active, goal: weight loss' },
  { icon: '🍽️', label: 'Meal Plan',    desc: '7-day personalized meal plan', prompt: 'Create a 7-day meal plan for 1800 calories/day, high protein, no pork' },
  { icon: '📊', label: 'Macros',       desc: 'Macro breakdown for my goal', prompt: 'What should my macronutrient split be for muscle gain? I weigh 80 kg' },
  { icon: '🥦', label: 'Food Info',    desc: 'Nutrition facts for any food', prompt: 'Give me the full nutritional profile of 100g of chicken breast, salmon, and broccoli' },
];

export default function ChatWindow({ messages, streaming, onSuggestion, onBack }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showTyping = streaming && messages.length > 0 && messages[messages.length - 1].content === '';

  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <div className="welcome">
          <div className="welcome-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
              <defs>
                <linearGradient id="welcomeHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b9d"/>
                  <stop offset="100%" stopColor="#c9003c"/>
                </linearGradient>
              </defs>
              <path d="M36 62C36 62 8 44 8 25C8 15.6 15.6 8 25 8C30.4 8 36 13 36 13C36 13 41.6 8 47 8C56.4 8 64 15.6 64 25C64 44 36 62 36 62Z" fill="url(#welcomeHeartGrad)"/>
              <polyline points="14,36 20,36 24,26 28,46 32,30 36,36 44,36 48,22 52,36 60,36" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
            </svg>
          </div>
          <h2>Hello, I am Heal-ios</h2>
          <p>
            Your AI-powered health assistant. I can calculate your calorie needs,
            build personalized meal plans, answer nutrition questions, and help design
            client diets — just like JARVIS, but for health.
          </p>
          <div className="suggestion-grid">
            {SUGGESTIONS.map((s) => (
              <div
                key={s.label}
                className="suggestion-card"
                onClick={() => onSuggestion(s.prompt)}
              >
                <div className="icon">{s.icon}</div>
                <div className="label">{s.label}</div>
                <div className="desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button className="back-btn" onClick={onBack}>← Back</button>
          {messages.map((msg, i) =>
            msg.content === '' ? null : (
              <MessageBubble key={i} message={msg} />
            )
          )}
          {showTyping && <TypingIndicator />}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
