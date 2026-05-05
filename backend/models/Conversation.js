import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional because anonymous users don't have an ID
  },
  context: {
    type: String,
    enum: ['love', 'family', 'career', 'anxiety', 'low', 'other'],
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [{
    role: { type: String, enum: ['user', 'model'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

export default mongoose.model('Conversation', conversationSchema);
