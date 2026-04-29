import mongoose from 'mongoose';

const moodEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  score: {
    type: Number, // 1-10
    required: true,
    min: 1,
    max: 10,
  },
  note: {
    type: String,
    default: '',
  },
  conversationSummary: {
    type: String,
    default: '',
  },
  emotions: {
    type: [String],
    default: [],
  },
  triggeredCrisis: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('MoodEntry', moodEntrySchema);
