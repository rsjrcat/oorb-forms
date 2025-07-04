import express from 'express';
import Integration from '../models/Integration.js';
import { triggerIntegration } from '../services/integrationService.js';

const router = express.Router();

// Get integrations for a form
router.get('/form/:formId', async (req, res) => {
  try {
    const integrations = await Integration.find({ formId: req.params.formId });
    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create integration
router.post('/', async (req, res) => {
  try {
    const integration = new Integration(req.body);
    await integration.save();
    res.status(201).json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update integration
router.put('/:id', async (req, res) => {
  try {
    const integration = await Integration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete integration
router.delete('/:id', async (req, res) => {
  try {
    const integration = await Integration.findByIdAndDelete(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test integration
router.post('/:id/test', async (req, res) => {
  try {
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const testData = {
      formId: integration.formId,
      responses: [
        { fieldLabel: 'Test Field', value: 'Test Value' }
      ],
      submittedAt: new Date(),
      isTest: true
    };

    await triggerIntegration(integration, testData);
    res.json({ message: 'Integration test successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;