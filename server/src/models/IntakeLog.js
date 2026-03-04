import mongoose from 'mongoose';

const intakeLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 5000,
  },
  type: {
    type: String,
    enum: ['glass', 'bottle', 'custom'],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String,
    required: true,
  },
});

intakeLogSchema.index({ userId: 1, date: 1 });

export default mongoose.model('IntakeLog', intakeLogSchema);
