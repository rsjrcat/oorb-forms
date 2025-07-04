import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Upload, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { formAPI, responseAPI } from '../../services/api';
import FormHeader from './FormHeader';
import ResponseSavePrompt from './ResponseSavePrompt';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

interface Form {
  _id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: string;
  settings?: {
    requireLogin?: boolean;
    allowMultipleResponses?: boolean;
    showProgressBar?: boolean;
  };
  views?: number;
  responses?: number;
  createdAt?: string;
}

const FormRenderer: React.FC = () => {
  const { shareUrl } = useParams<{ shareUrl: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    if (shareUrl) {
      loadForm();
    }
  }, [shareUrl]);

  const loadForm = async () => {
    try {
      const response = await formAPI.getFormByShareUrl(shareUrl!);
      setForm(response.data);
      
      // Calculate estimated time (rough estimate: 30 seconds per field)
      const estimatedTime = Math.ceil(response.data.fields.length * 0.5);
      setForm(prev => prev ? { ...prev, estimatedTime } : null);
    } catch (error) {
      toast.error('Form not found');
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (value && field.validation) {
      const { minLength, maxLength, pattern } = field.validation;
      
      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }
      
      if (maxLength && value.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }
      
      if (pattern && !new RegExp(pattern).test(value)) {
        return field.validation.errorMessage || `${field.label} format is invalid`;
      }
    }

    return null;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Check if login is required
    if (form.settings?.requireLogin && !user) {
      toast.error('Please sign in to submit this form');
      return;
    }

    // Show save prompt if user is not logged in
    if (!user && !form.settings?.requireLogin) {
      setShowSavePrompt(true);
      return;
    }

    // Submit directly if user is logged in
    await submitResponse(true, user);
  };

  const submitResponse = async (saveToAccount: boolean, userData?: any) => {
    if (!form) return;

    setSubmitting(true);
    
    try {
      const formattedResponses = form.fields.map(field => ({
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        value: responses[field.id] || ''
      }));

      const completionTime = Math.round((Date.now() - startTime) / 1000);

      await responseAPI.submitResponse({
        formId: form._id,
        responses: formattedResponses,
        completionTime,
        submitterInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: saveToAccount && userData ? userData.id : null,
          savedToAccount: saveToAccount
        }
      });

      setSubmitted(true);
      toast.success('Form submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit form');
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseClasses = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      errors[field.id] ? 'border-red-300' : 'border-gray-300'
    }`;
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <textarea
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div>
            <select 
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            >
              <option value="">Choose an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    name={field.id} 
                    value={option}
                    checked={responses[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    value={option}
                    checked={(responses[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = responses[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleInputChange(field.id, newValues);
                    }}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div>
            <input
              type="date"
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div>
            <div className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
              errors[field.id] ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={(e) => handleInputChange(field.id, e.target.files?.[0]?.name || '')}
                className="hidden"
                id={field.id}
              />
              <label htmlFor={field.id} className="cursor-pointer text-blue-600 hover:text-blue-700">
                Click to upload or drag and drop
              </label>
              {responses[field.id] && (
                <p className="text-sm text-gray-600 mt-2">Selected: {responses[field.id]}</p>
              )}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      case 'rating':
        return (
          <div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 cursor-pointer transition-colors ${
                    (responses[field.id] || 0) >= star 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  onClick={() => handleInputChange(field.id, star)}
                />
              ))}
              {responses[field.id] && (
                <span className="ml-2 text-sm text-gray-600">
                  {responses[field.id]}/5
                </span>
              )}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (form.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-4">Your response has been submitted successfully.</p>
            {user && (
              <p className="text-sm text-blue-600">
                Your response has been saved to your account.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <FormHeader form={form} />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Progress Bar */}
          {form.settings?.showProgressBar && form.fields.length > 5 && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round((Object.keys(responses).length / form.fields.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(Object.keys(responses).length / form.fields.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Login Requirement Notice */}
          {form.settings?.requireLogin && !user && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Sign in required</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                You must be signed in to submit this form.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
            
            <button
              type="submit"
              disabled={submitting || (form.settings?.requireLogin && !user)}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <ResponseSavePrompt
        isOpen={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveResponse={submitResponse}
        formTitle={form.title}
      />
    </div>
  );
};

export default FormRenderer;