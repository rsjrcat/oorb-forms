import express from 'express';
import Form from '../models/Form.js';
import Response from '../models/Response.js';

const router = express.Router();

// Get all forms
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find().sort({ updatedAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
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

// Create new form
router.post('/', async (req, res) => {
  try {
    const form = new Form(req.body);
    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update form
router.put('/:id', async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
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

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
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

// Publish form
router.post('/:id/publish', async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
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

// Get form analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
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