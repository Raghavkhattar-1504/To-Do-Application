import 'dotenv/config';
import { createApp } from './app.js';
import { connect } from './db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo';
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

try {
  await connect(MONGODB_URI);
  console.log(`Connected to MongoDB at ${MONGODB_URI}`);
} catch (err) {
  console.error(`Could not connect to MongoDB at ${MONGODB_URI}. Is it running (npm run db:up)?`);
  console.error(err.message);
  process.exit(1);
}

createApp({ clientOrigin: CLIENT_ORIGIN }).listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
