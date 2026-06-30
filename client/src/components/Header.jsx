export default function Header({ onNewChat }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="26" height="26">
            <defs>
              <linearGradient id="headerHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b9d"/>
                <stop offset="100%" stopColor="#c9003c"/>
              </linearGradient>
            </defs>
            <path d="M18 31C18 31 4 22 4 12.5C4 7.8 7.8 4 12.5 4C15.2 4 18 6.5 18 6.5C18 6.5 20.8 4 23.5 4C28.2 4 32 7.8 32 12.5C32 22 18 31 18 31Z" fill="url(#headerHeartGrad)"/>
            <polyline points="7,18 10,18 12,13 14,23 16,15 18,18 22,18 24,11 26,18 30,18" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
          </svg>
        </div>
        <div className="header-title">
          <h1>Heal-ios</h1>
          <p>AI Health Assistant v1.0</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="new-chat-btn" onClick={onNewChat} title="Start new chat">
          + New Chat
        </button>
        <div className="status-badge">
          <span className="status-dot" />
          ONLINE
        </div>
      </div>
    </header>
  );
}
