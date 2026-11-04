import mongoose from 'mongoose';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title is required'],
    },
    description: { type: String, trim: true, default: '' },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [DATE_PATTERN, 'Date must be YYYY-MM-DD'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [TIME_PATTERN, 'Start time must be HH:mm'],
    },
    endTime: {
      type: String,
      default: null,
      match: [TIME_PATTERN, 'End time must be HH:mm'],
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: 'Priority must be low, medium, or high' },
      default: null,
    },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
