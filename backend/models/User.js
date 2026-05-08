import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  emergencyContact: {
    type: String,
    default: '',
  },
  // Legacy field — kept for backward compat
  consentToDataUse: {
    type: Boolean,
    default: false,
  },
  // Structured consent (v1.0)
  consent: {
    memoryEnabled:   { type: Boolean, default: true },
    trainingEnabled: { type: Boolean, default: false },
    ageConfirmed:    { type: Boolean, default: false },
    consentDate:     { type: Date },
    consentVersion:  { type: String, default: '1.0' },
  },
  consentComplete: {
    type: Boolean,
    default: false,
  },
  // Rolling cross-session memory
  memory: {
    lastConversationSummary: { type: String, default: '' },
    keyTopics:               [String],
    emotionalState:          { type: String, default: '' },
    lastSeen:                { type: Date },
    importantThings:         [String],
  },
  alertLevel: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal',
  }
});

export default mongoose.model('User', userSchema);

