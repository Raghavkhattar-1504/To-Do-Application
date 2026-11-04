import { Router } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EDITABLE_FIELDS = ['title', 'description', 'date', 'startTime', 'endTime', 'priority', 'completed'];

export const tasksRouter = Router();

function pickEditable(body) {
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  for (const nullable of ['endTime', 'priority']) {
    if (updates[nullable] === '') updates[nullable] = null;
  }
  return updates;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function badRequest(res, error) {
  return res.status(400).json({ error });
}

tasksRouter.get('/', async (req, res, next) => {
  try {
    const { from, to, q } = req.query;
    const filter = {};

    if (from !== undefined || to !== undefined) {
      if ((from && !DATE_PATTERN.test(from)) || (to && !DATE_PATTERN.test(to))) {
        return badRequest(res, 'from and to must be YYYY-MM-DD');
      }
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    if (typeof q === 'string' && q.trim()) {
      const pattern = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: pattern }, { description: pattern }];
    }

    const tasks = await Task.find(filter).sort({ date: 1, startTime: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', async (req, res, next) => {
  try {
    const task = await Task.create(pickEditable(req.body ?? {}));
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid task id');
    const task = await Task.findByIdAndUpdate(req.params.id, pickEditable(req.body ?? {}), {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badRequest(res, 'Invalid task id');
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
