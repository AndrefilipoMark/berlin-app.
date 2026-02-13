import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from './api/chat/auto-reply.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Emulate Vercel Serverless Function
app.post('/api/chat/auto-reply', async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 Local AI Server running on http://localhost:${PORT}`);
});
