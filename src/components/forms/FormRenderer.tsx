import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Upload, Send, CheckCircle } from 'lucide-react';
import { formAPI, responseAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  _id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: string;
}

const FormRenderer: React.FC = () => {
  const { shareUrl } = useParams<{ shareUrl: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (shareUrl) {
      loadForm();
    }
  }, [shareUrl]);

  const loadForm = async () => {
    try {
      const response = await formAPI.getFormByShareUrl(shareUrl!);
      setForm(response.data);
    } catch (error) {
      toast.error('Form not found');
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && !responses[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

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
          timestamp: new Date().toISOString()
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
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseClasses}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={4}
            className={baseClasses}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select 
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseClasses}
            required={field.required}
          >
            <option value="">Choose an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name={field.id} 
                  value={option}
                  checked={responses[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
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
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={responses[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={baseClasses}
            required={field.required}
          />
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0]?.name || '')}
              className="hidden"
              id={field.id}
              required={field.required}
            />
            <label htmlFor={field.id} className="cursor-pointer text-blue-600 hover:text-blue-700">
              Click to upload or drag and drop
            </label>
          </div>
        );
      
      case 'rating':
        return (
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
            <p className="text-gray-600">Your response has been submitted successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
            <p className="text-gray-600">{form.description}</p>
          </div>
          
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
              disabled={submitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
    </div>
  );
};

export default FormRenderer;