import mongoose from 'mongoose';

const dailyStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  totalMl: {
    type: Number,
    default: 0,
  },
  goal: {
    type: Number,
    default: 2500,
  },
  goalMet: {
    type: Boolean,
    default: false,
  },
  entryCount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

dailyStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyStats', dailyStatsSchema);
