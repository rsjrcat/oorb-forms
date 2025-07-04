import express from 'express';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all forms (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const forms = await Form.find({ createdBy: req.user._id }).sort({ updatedAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by share URL (public)
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

// Create new form (protected)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const form = new Form({
      ...req.body,
      createdBy: req.user._id
    });
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update form (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete form (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Also delete all responses for this form
    await Response.deleteMany({ formId: req.params.id });
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish form (protected)
router.post('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: 'published', updatedAt: new Date() },
      { new: true }
    );
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form analytics (protected)
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
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