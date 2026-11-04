import 'dotenv/config';
import { connect, disconnect } from './db.js';
import { Task } from './models/Task.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo';

function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayOfCurrentWeek(offsetFromMonday) {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setDate(monday.getDate() + offsetFromMonday);
  return isoDate(monday);
}

function todayOffset() {
  return (new Date().getDay() + 6) % 7;
}

function sampleTasks() {
  const today = todayOffset();
  const other = (today + 2) % 7;
  const another = (today + 4) % 7;

  return [
    { title: 'Finishing Wireframe', description: 'Home and add-task screens', date: dayOfCurrentWeek(today), startTime: '09:00', endTime: '11:00', priority: 'high' },
    { title: 'Meeting with team', description: 'Weekly sync', date: dayOfCurrentWeek(today), startTime: '11:30', endTime: '12:00', priority: 'medium' },
    { title: 'Buy a cat food', date: dayOfCurrentWeek(today), startTime: '18:00', completed: true },
    { title: 'Finishing daily commission', date: dayOfCurrentWeek(today), startTime: '20:00', completed: true, priority: 'low' },
    { title: 'Review pull requests', description: 'Client and API repos', date: dayOfCurrentWeek(other), startTime: '10:00', priority: 'medium' },
    { title: 'Doing Homework', description: 'Chapter 4 exercises', date: dayOfCurrentWeek(other), startTime: '16:00', endTime: '17:30', completed: true },
    { title: 'Grocery run', date: dayOfCurrentWeek(another), startTime: '08:30' },
    { title: 'Plan next sprint', description: 'Draft stories for search', date: dayOfCurrentWeek(another), startTime: '14:00', priority: 'high' },
  ];
}

try {
  await connect(MONGODB_URI);
  await Task.deleteMany({});
  const created = await Task.insertMany(sampleTasks());
  console.log(`Seeded ${created.length} tasks for the week of ${dayOfCurrentWeek(0)}.`);
} catch (err) {
  console.error(`Seeding failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await disconnect();
}
