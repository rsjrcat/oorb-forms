import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;