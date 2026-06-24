export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">🥗</div>
        <div className="header-title">
          <h1>NutriBot</h1>
          <p>AI Dietitian Assistant v1.0</p>
        </div>
      </div>
      <div className="status-badge">
        <span className="status-dot" />
        ONLINE
      </div>
    </header>
  );
}
