import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const SUGGESTIONS = [
  { icon: '🧮', label: 'Calculate BMR', desc: 'BMR & daily calorie needs', prompt: 'Calculate BMR and TDEE for a 30-year-old woman, 65 kg, 165 cm, moderately active, goal: weight loss' },
  { icon: '🍽️', label: 'Meal Plan',    desc: '7-day personalized meal plan', prompt: 'Create a 7-day meal plan for 1800 calories/day, high protein, no pork' },
  { icon: '📊', label: 'Macros',       desc: 'Macro breakdown for my goal', prompt: 'What should my macronutrient split be for muscle gain? I weigh 80 kg' },
  { icon: '🥦', label: 'Food Info',    desc: 'Nutrition facts for any food', prompt: 'Give me the full nutritional profile of 100g of chicken breast, salmon, and broccoli' },
];

export default function ChatWindow({ messages, streaming, onSuggestion }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showTyping = streaming && messages.length > 0 && messages[messages.length - 1].content === '';

  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <div className="welcome">
          <div className="welcome-icon">🥗</div>
          <h2>Hello, I am NutriBot</h2>
          <p>
            Your AI-powered dietitian assistant. I can calculate your calorie needs,
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
