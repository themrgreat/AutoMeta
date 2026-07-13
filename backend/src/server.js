import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import { seedTemplates } from './models/Template.js';

import uploadRoutes from './routes/upload.js';
import templateRoutes from './routes/templates.js';
import senderRoutes from './routes/senders.js';
import generateRoutes from './routes/generate.js';
import emailRoutes from './routes/emails.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/imports', uploadRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/emails', emailRoutes);

// Central error handler — keeps route code free of repetitive try/catch noise
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5050;

async function start() {
  try {
    await connectDB();
    await seedTemplates();
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

start();
