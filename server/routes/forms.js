import express from 'express';
import jwt from 'jsonwebtoken';
import Form from '../models/Form.js';
import Response from '../models/Response.js';

const router = express.Router();

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Get all forms for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit, sort } = req.query;
    let query = Form.find({ createdBy: req.user.userId });
    
    if (sort) {
      query = query.sort({ [sort]: -1 });
    } else {
      query = query.sort({ updatedAt: -1 });
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const forms = await query.populate('createdBy', 'name email');
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID (only if user owns it)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    }).populate('createdBy', 'name email');
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by share URL (public - no authentication needed)
router.get('/share/:shareUrl', async (req, res) => {
  try {
    const form = await Form.findOne({ shareUrl: req.params.shareUrl });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Increment view count
    form.views += 1;
    await form.save();
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new form
router.post('/', authenticateToken, async (req, res) => {
  try {
    const formData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const form = new Form(formData);
    await form.save();
    
    const populatedForm = await Form.findById(form._id).populate('createdBy', 'name email');
    res.status(201).json(populatedForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update form (only if user owns it)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }
    res.json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete form (only if user owns it)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }
    
    // Also delete all responses for this form
    await Response.deleteMany({ formId: req.params.id });
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish form (only if user owns it)
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { status: 'published', updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form analytics (only if user owns it)
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    const responses = await Response.find({ formId: req.params.id });
    
    // Calculate analytics
    const totalResponses = responses.length;
    const completionRate = form.views > 0 ? (totalResponses / form.views) * 100 : 0;
    
    // Response trends (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const recentResponses = responses.filter(r => r.submittedAt >= last7Days);
    
    const analytics = {
      totalViews: form.views,
      totalResponses,
      completionRate: Math.round(completionRate * 100) / 100,
      recentResponses: recentResponses.length,
      averageCompletionTime: responses.reduce((acc, r) => acc + (r.completionTime || 0), 0) / totalResponses || 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;