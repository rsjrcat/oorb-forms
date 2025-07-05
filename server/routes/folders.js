import express from 'express';
import jwt from 'jsonwebtoken';
import Folder from '../models/Folder.js';
import Form from '../models/Form.js';

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

// Get all folders for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const folders = await Folder.find({ createdBy: req.user.userId })
      .sort({ updatedAt: -1 })
      .populate('createdBy', 'name email');
    
    // Update form count for each folder
    for (let folder of folders) {
      const formCount = await Form.countDocuments({ 
        folderId: folder._id,
        createdBy: req.user.userId 
      });
      if (folder.formCount !== formCount) {
        folder.formCount = formCount;
        await folder.save();
      }
    }
    
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get folder by ID with forms (only if user owns it)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    }).populate('createdBy', 'name email');
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }
    
    const forms = await Form.find({ 
      folderId: req.params.id,
      createdBy: req.user.userId 
    }).sort({ updatedAt: -1 });
    
    res.json({
      folder,
      forms
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new folder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const folderData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const folder = new Folder(folderData);
    await folder.save();
    
    const populatedFolder = await Folder.findById(folder._id).populate('createdBy', 'name email');
    res.status(201).json(populatedFolder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update folder (only if user owns it)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }
    res.json(folder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete folder (only if user owns it)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }
    
    // Check if folder has forms
    const formCount = await Form.countDocuments({ 
      folderId: req.params.id,
      createdBy: req.user.userId 
    });
    
    if (formCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder with forms. Please move or delete all forms first.' 
      });
    }
    
    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Move forms to folder (only if user owns both folder and forms)
router.post('/:id/move-forms', authenticateToken, async (req, res) => {
  try {
    const { formIds } = req.body;
    
    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.userId 
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }
    
    // Only update forms that belong to the user
    await Form.updateMany(
      { 
        _id: { $in: formIds },
        createdBy: req.user.userId 
      },
      { folderId: req.params.id, updatedAt: new Date() }
    );
    
    // Update folder form count
    folder.formCount = await Form.countDocuments({ 
      folderId: req.params.id,
      createdBy: req.user.userId 
    });
    await folder.save();
    
    res.json({ message: 'Forms moved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;