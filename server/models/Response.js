import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  responses: [{
    fieldId: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    fieldType: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed,
    files: [String] // For file uploads
  }],
  submittedAt: { type: Date, default: Date.now },
  submitterInfo: {
    ip: String,
    userAgent: String,
    location: String
  },
  completionTime: Number, // in seconds
  isComplete: { type: Boolean, default: true }
});

export default mongoose.model('Response', responseSchema);