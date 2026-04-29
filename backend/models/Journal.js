import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  encryptedContent: {
    type: String,
    required: true,
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Journal', journalSchema);
