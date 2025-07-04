import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Sign up
  signup: (userData: { name: string; email: string; password: string }) => 
    api.post('/auth/signup', userData),
  
  // Login
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Logout
  logout: () => api.post('/auth/logout'),
};

// Form API
export const formAPI = {
  // Get all forms
  getForms: () => api.get('/forms'),
  
  // Get form by ID
  getForm: (id: string) => api.get(`/forms/${id}`),
  
  // Get form by share URL (public)
  getFormByShareUrl: (shareUrl: string) => api.get(`/forms/share/${shareUrl}`),
  
  // Create form
  createForm: (formData: any) => api.post('/forms', formData),
  
  // Update form
  updateForm: (id: string, formData: any) => api.put(`/forms/${id}`, formData),
  
  // Delete form
  deleteForm: (id: string) => api.delete(`/forms/${id}`),
  
  // Publish form
  publishForm: (id: string) => api.post(`/forms/${id}/publish`),
  
  // Get analytics
  getAnalytics: (id: string) => api.get(`/forms/${id}/analytics`),
};

// Response API
export const responseAPI = {
  // Submit response
  submitResponse: (responseData: any) => api.post('/responses', responseData),
  
  // Get responses for form
  getResponses: (formId: string, page = 1, limit = 10) => 
    api.get(`/responses/form/${formId}?page=${page}&limit=${limit}`),
  
  // Get single response
  getResponse: (id: string) => api.get(`/responses/${id}`),
  
  // Delete response
  deleteResponse: (id: string) => api.delete(`/responses/${id}`),
};

// Export API
export const exportAPI = {
  // Get export summary
  getExportSummary: (formId: string) => api.get(`/exports/summary/${formId}`),
  
  // Download Excel
  downloadExcel: (formId: string) => {
    window.open(`${API_BASE_URL}/exports/excel/${formId}`, '_blank');
  },
  
  // Download CSV
  downloadCSV: (formId: string) => {
    window.open(`${API_BASE_URL}/exports/csv/${formId}`, '_blank');
  },
};

// Integration API
export const integrationAPI = {
  // Get integrations for form
  getIntegrations: (formId: string) => api.get(`/integrations/form/${formId}`),
  
  // Create integration
  createIntegration: (integrationData: any) => api.post('/integrations', integrationData),
  
  // Update integration
  updateIntegration: (id: string, integrationData: any) => api.put(`/integrations/${id}`, integrationData),
  
  // Delete integration
  deleteIntegration: (id: string) => api.delete(`/integrations/${id}`),
  
  // Test integration
  testIntegration: (id: string) => api.post(`/integrations/${id}/test`),
};

// Template API
export const templateAPI = {
  // Get all templates
  getTemplates: (category?: string) => api.get(`/templates${category ? `?category=${category}` : ''}`),
  
  // Get template by ID
  getTemplate: (id: string) => api.get(`/templates/${id}`),
};

export default api;