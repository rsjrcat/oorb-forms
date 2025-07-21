import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file', 'rating']
  },
  label: { type: String, required: true },
  placeholder: String,
  required: { type: Boolean, default: false },
  options: [String],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String
  }
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  fields: [fieldSchema],
  folderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Folder',
    default: null // null means standalone form
  },
  settings: {
    allowMultipleResponses: { type: Boolean, default: true },
    requireLogin: { type: Boolean, default: false },
    showProgressBar: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    responseLimit: { type: Number, default: null },
    shuffleQuestions: { type: Boolean, default: false },
    confirmationPage: { type: Boolean, default: true },
    customTheme: {
      primaryColor: { type: String, default: '#3B82F6' },
      backgroundColor: { type: String, default: '#FFFFFF' }
    }
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'closed'], 
    default: 'draft' 
  },
  shareUrl: { type: String, unique: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Analytics
  views: { type: Number, default: 0 },
  responses: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }
});

// Generate unique share URL before saving
formSchema.pre('save', function(next) {
  if (!this.shareUrl) {
    this.shareUrl = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Form', formSchema);