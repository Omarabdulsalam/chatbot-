# 🥗 NutriBot — AI Dietitian Assistant

A **JARVIS-style** AI chatbot built for dietitians. NutriBot can calculate BMR/TDEE, design meal plans, answer nutrition questions, and assist with all dietary calculations — powered by **Claude AI** and featuring **voice interaction**.

---

## Features

- **Jarvis-style UI** — dark, sleek, professional interface
- **Claude AI** — powered by Anthropic's claude-sonnet-4-6 model
- **Nutrition calculations** — BMR, TDEE, BMI, macros, IBW, calorie targets
- **Meal planning** — personalized weekly plans with macros
- **Food database knowledge** — full nutritional profiles for any food
- **Voice input & output** — speak to NutriBot and hear responses (Web Speech API)
- **Streaming responses** — real-time text streaming like ChatGPT
- **Markdown rendering** — tables, lists, formatted output

---

## Project Structure

```
nutribot/
├── server/              # Node.js + Express backend
│   ├── index.js         # Entry point
│   ├── routes/
│   │   └── chat.js      # Claude API + SSE streaming
│   ├── .env.example     # Environment variable template
│   └── package.json
└── client/              # React + Vite frontend
    ├── src/
    │   ├── App.jsx
    │   ├── App.css      # Jarvis dark theme
    │   └── components/
    │       ├── Header.jsx
    │       ├── ChatWindow.jsx
    │       ├── MessageBubble.jsx
    │       ├── InputArea.jsx
    │       └── TypingIndicator.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repo
```bash
git clone https://github.com/Omarabdulsalam/chatbot-.git
cd chatbot-
```

### 2. Set up the server
```bash
cd server
npm install
cp .env.example .env
# Open .env and add your Anthropic API key
```

Edit `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

### 3. Set up the client
```bash
cd ../client
npm install
```

### 4. Run the app

**Terminal 1 — Start the server:**
```bash
cd server
npm run dev
```

**Terminal 2 — Start the client:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage Examples

NutriBot can handle:

- *"Calculate BMR and TDEE for a 28-year-old male, 85kg, 180cm, lightly active, goal: weight loss"*
- *"Create a 7-day meal plan for 2000 calories, high protein, vegetarian"*
- *"What are the macros in 100g of chicken breast?"*
- *"Design a diet for a diabetic patient with 1600 kcal target"*
- *"What's the glycemic index of brown rice vs white rice?"*

---

## Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | React 18, Vite                |
| Backend  | Node.js, Express              |
| AI Model | Claude Sonnet (Anthropic)     |
| Voice    | Web Speech API (built-in)     |
| Styling  | Custom CSS (Jarvis dark theme)|

---

## License

MIT
