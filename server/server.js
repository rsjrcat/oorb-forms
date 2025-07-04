import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import formRoutes from './routes/forms.js';
import responseRoutes from './routes/responses.js';
import exportRoutes from './routes/exports.js';
import integrationRoutes from './routes/integrations.js';
import templateRoutes from './routes/templates.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Enhanced OORB Forms API with Authentication is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oorb-forms')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Enhanced OORB Forms Server running on port ${PORT}`);
      console.log(`📊 Features: AI Builder, Templates, Integrations, Analytics, Authentication`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

export default app;