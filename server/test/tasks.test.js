import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connect, disconnect } from '../src/db.js';
import { Task } from '../src/models/Task.js';

let mongo;
const app = createApp();

beforeAll(async () => {
  if (process.env.MONGODB_TEST_URI) {
    await connect(process.env.MONGODB_TEST_URI);
    return;
  }
  mongo = await MongoMemoryServer.create();
  await connect(mongo.getUri());
});

afterAll(async () => {
  await disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('GET /api/tasks', () => {
  it('returns only tasks in the inclusive date range, ordered by date then start time', async () => {
    await Task.insertMany([
      { title: 'Before range', date: '2026-11-01', startTime: '09:00' },
      { title: 'Monday late', date: '2026-11-02', startTime: '15:00' },
      { title: 'Monday early', date: '2026-11-02', startTime: '08:00' },
      { title: 'Sunday', date: '2026-11-08', startTime: '10:00' },
      { title: 'After range', date: '2026-11-09', startTime: '10:00' },
    ]);

    const res = await request(app).get('/api/tasks?from=2026-11-02&to=2026-11-08');

    expect(res.status).toBe(200);
    expect(res.body.map((task) => task.title)).toEqual(['Monday early', 'Monday late', 'Sunday']);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).not.toHaveProperty('_id');
  });

  it('rejects malformed range dates', async () => {
    const res = await request(app).get('/api/tasks?from=11/02/2026');
    expect(res.status).toBe(400);
  });

  it('searches title and description case-insensitively', async () => {
    await Task.insertMany([
      { title: 'Finishing Wireframe', date: '2026-11-02', startTime: '09:00' },
      { title: 'Meeting', description: 'finish agenda', date: '2026-11-03', startTime: '09:00' },
      { title: 'Buy cat food', date: '2026-11-04', startTime: '09:00' },
    ]);

    const res = await request(app).get('/api/tasks?q=FINISH');

    expect(res.status).toBe(200);
    expect(res.body.map((task) => task.title)).toEqual(['Finishing Wireframe', 'Meeting']);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with defaults for optional fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '  Doing Homework  ', date: '2026-11-05', startTime: '16:00' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Doing Homework',
      description: '',
      date: '2026-11-05',
      startTime: '16:00',
      endTime: null,
      priority: null,
      completed: false,
    });
  });

  it.each([
    ['title', { date: '2026-11-05', startTime: '16:00' }],
    ['date', { title: 'No date', startTime: '16:00' }],
    ['startTime', { title: 'No time', date: '2026-11-05' }],
  ])('returns 400 when %s is missing', async (field, body) => {
    const res = await request(app).post('/api/tasks').send(body);

    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty(field);
    expect(await Task.countDocuments()).toBe(0);
  });

  it('rejects an unknown priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad priority', date: '2026-11-05', startTime: '09:00', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.fields).toHaveProperty('priority');
  });
});

describe('PATCH and DELETE /api/tasks/:id', () => {
  it('updates fields and validates them', async () => {
    const task = await Task.create({ title: 'Toggle me', date: '2026-11-05', startTime: '09:00' });

    const ok = await request(app).patch(`/api/tasks/${task.id}`).send({ completed: true });
    expect(ok.status).toBe(200);
    expect(ok.body.completed).toBe(true);

    const bad = await request(app).patch(`/api/tasks/${task.id}`).send({ startTime: '25:00' });
    expect(bad.status).toBe(400);
  });

  it('deletes a task and returns 404 afterwards', async () => {
    const task = await Task.create({ title: 'Delete me', date: '2026-11-05', startTime: '09:00' });

    expect((await request(app).delete(`/api/tasks/${task.id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/tasks/${task.id}`)).status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).patch('/api/tasks/not-an-id').send({ completed: true });
    expect(res.status).toBe(400);
  });
});
