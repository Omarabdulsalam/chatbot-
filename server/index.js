require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'NutriBot server is running' });
});

app.listen(PORT, () => {
  console.log(`\n🥗 NutriBot server running on http://localhost:${PORT}\n`);
});
