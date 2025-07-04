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
    pattern: String,
    errorMessage: String
  }
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  fields: [fieldSchema],
  settings: {
    allowMultipleResponses: { type: Boolean, default: true },
    requireLogin: { type: Boolean, default: false },
    showProgressBar: { type: Boolean, default: true },
    customTheme: {
      primaryColor: { type: String, default: '#3B82F6' },
      backgroundColor: { type: String, default: '#FFFFFF' },
      fontFamily: { type: String, default: 'Inter' }
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
  completionRate: { type: Number, default: 0 },
  
  // Conditional Logic
  conditionalRules: [{
    id: String,
    fieldId: String,
    condition: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
    value: String,
    action: { type: String, enum: ['show', 'hide', 'require', 'skip_to'] },
    targetFieldId: String
  }]
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