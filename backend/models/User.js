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
  consentToDataUse: {
    type: Boolean,
    default: false,
  },
  alertLevel: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal',
  }
});

export default mongoose.model('User', userSchema);
