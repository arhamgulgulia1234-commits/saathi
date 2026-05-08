import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:           { type: String, enum: ['user', 'assistant'], required: true },
  content:        { type: String, required: true },
  conversationId: { type: String, required: true },
  createdAt:      { type: Date, default: Date.now }
});

messageSchema.index({ userId: 1, conversationId: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
