import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { tasksRouter } from './routes/tasks.js';

export function createApp({ clientOrigin } = {}) {
  const app = express();

  const origins = clientOrigin
    ? clientOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : true;
  app.use(cors({ origin: origins }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/tasks', tasksRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  app.use((err, _req, res, _next) => {
    if (err instanceof mongoose.Error.ValidationError) {
      const fields = Object.fromEntries(
        Object.entries(err.errors).map(([field, detail]) => [field, detail.message]),
      );
      return res.status(400).json({ error: 'Validation failed', fields });
    }
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: `Invalid value for ${err.path}` });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
