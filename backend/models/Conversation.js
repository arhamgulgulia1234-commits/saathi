import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  userId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversationId:       { type: String, required: true, unique: true },
  title:                { type: String, default: 'New conversation' },
  context:              { type: String },
  summary:              { type: String },
  keyTopics:            [String],
  emotionalState:       { type: String },
  moodScore:            { type: Number, min: 1, max: 10 },
  messageCount:         { type: Number, default: 0 },
  startedAt:            { type: Date, default: Date.now },
  endedAt:              { type: Date },
  excludeFromTraining:  { type: Boolean, default: false },
});

conversationSchema.index({ userId: 1, startedAt: -1 });
conversationSchema.index({ conversationId: 1 });

export default mongoose.model('Conversation', conversationSchema);

