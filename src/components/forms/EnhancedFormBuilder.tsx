import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Type, 
  CheckSquare, 
  Circle, 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  Upload, 
  Star,
  Plus,
  Trash2,
  Settings,
  Eye,
  Save,
  Share2,
  ArrowLeft,
  Send,
  Sparkles,
  Palette,
  Code,
  Zap,
  BarChart3,
  GitBranch,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import { formAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AIFormBuilder from './AIFormBuilder';
import TemplateLibrary from './TemplateLibrary';
import EmbedCodeGenerator from './EmbedCodeGenerator';
import IntegrationsPanel from './IntegrationsPanel';
import ConditionalLogic from './ConditionalLogic';
import AdvancedValidation from './AdvancedValidation';
import FormAnalytics from './FormAnalytics';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
}

interface Form {
  _id?: string;
  title: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'closed';
  shareUrl?: string;
  conditionalRules?: any[];
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

interface EnhancedFormBuilderProps {
  formId?: string;
  onBack: () => void;
}

const EnhancedFormBuilder: React.FC<EnhancedFormBuilderProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form>({
    title: 'Untitled Form',
    description: 'Form description',
    fields: [],
    status: 'draft',
    conditionalRules: [],
    theme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter'
    }
  });
  
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'logic' | 'design' | 'settings'>('fields');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileFieldEditorOpen, setMobileFieldEditorOpen] = useState(false);
  const [formSettings, setFormSettings] = useState({
    allowMultipleResponses: true,
    requireLogin: false,
    showProgressBar: true,
    customTheme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF'
    }
  });

  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'textarea', label: 'Long Answer', icon: FileText },
    { type: 'select', label: 'Dropdown', icon: CheckSquare },
    { type: 'radio', label: 'Multiple Choice', icon: Circle },
    { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'file', label: 'File Upload', icon: Upload },
    { type: 'rating', label: 'Rating', icon: Star }
  ];

  // Load form if editing
  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  useEffect(() => {
    if (form.settings) {
      setFormSettings(form.settings);
    }
  }, [form]);
  const loadForm = async () => {
    try {
      const response = await formAPI.getForm(formId!);
      setForm(response.data);
    } catch (error) {
      toast.error('Failed to load form');
      console.error('Error loading form:', error);
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `${fieldTypes.find(ft => ft.type === type)?.label} Field`,
      placeholder: type === 'textarea' ? 'Enter your answer here...' : 'Enter your answer',
      required: false,
      options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      validation: {}
    };
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
    setMobileFieldEditorOpen(true);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedField(null);
    setMobileFieldEditorOpen(false);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(form.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setForm(prev => ({ ...prev, fields: items }));
  };

  const saveForm = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a form title');
      return;
    }

    setSaving(true);
    try {
      const formDataToSave = {
        ...form,
        settings: formSettings
      };
      
      if (form._id) {
        await formAPI.updateForm(form._id, formDataToSave);
        toast.success('Form saved successfully');
      } else {
        const response = await formAPI.createForm(formDataToSave);
        setForm(response.data);
        toast.success('Form created successfully');
      }
    } catch (error) {
      toast.error('Failed to save form');
      console.error('Error saving form:', error);
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (!form._id) {
      toast.error('Please save the form first');
      return;
    }

    if (form.fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setPublishing(true);
    try {
      const response = await formAPI.publishForm(form._id);
      setForm(response.data);
      toast.success('Form published successfully!');
    } catch (error) {
      toast.error('Failed to publish form');
      console.error('Error publishing form:', error);
    } finally {
      setPublishing(false);
    }
  };

  const copyShareLink = () => {
    if (form.shareUrl) {
      const shareLink = `${window.location.origin}/form/${form.shareUrl}`;
      navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    }
  };

  const handleAIFormGenerated = (generatedForm: any) => {
    setForm(prev => ({
      ...prev,
      ...generatedForm,
      fields: generatedForm.fields.map((field: any, index: number) => ({
        ...field,
        id: `field_${Date.now()}_${index}`
      }))
    }));
    setShowAIBuilder(false);
    toast.success('AI form generated successfully!');
  };

  const handleTemplateSelected = (template: any) => {
    setForm(prev => ({
      ...prev,
      ...template
    }));
    setShowTemplates(false);
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className={baseClasses}
            disabled={!previewMode}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            className={baseClasses}
            disabled={!previewMode}
          />
        );
      
      case 'select':
        return (
          <select className={baseClasses} disabled={!previewMode}>
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
                <input type="radio" name={field.id} value={option} disabled={!previewMode} />
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
                <input type="checkbox" value={option} disabled={!previewMode} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className={baseClasses}
            disabled={!previewMode}
          />
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Click to upload or drag and drop</p>
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-gray-300 hover:text-yellow-400 cursor-pointer" />
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderFieldEditor = () => {
    const field = form.fields.find(f => f.id === selectedField);
    if (!field) return null;

    return (
      <div className={`bg-white border-l border-gray-200 p-6 w-80 shadow-lg fixed right-0 top-0 h-full z-20 md:relative md:z-0 ${
        mobileFieldEditorOpen ? 'block' : 'hidden md:block'
      }`}>
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h3 className="text-lg font-semibold">Field Settings</h3>
          <button 
            onClick={() => setMobileFieldEditorOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {['text', 'email', 'phone', 'textarea'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          
          {['radio', 'checkbox', 'select'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[index] = e.target.value;
                        updateField(field.id, { options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== index);
                        updateField(field.id, { options: newOptions });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                    updateField(field.id, { options: newOptions });
                  }}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="required"
              checked={field.required}
              onChange={(e) => updateField(field.id, { required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Required field
            </label>
          </div>

          <AdvancedValidation
            field={field}
            onValidationChange={(validation) => updateField(field.id, { validation })}
          />
          
          <button
            onClick={() => deleteField(field.id)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          >
            Delete Field
          </button>
        </div>
      </div>
    );
  };

  const renderDesignTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme Customization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={form.theme?.primaryColor || '#3B82F6'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, primaryColor: e.target.value }
                }))}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={form.theme?.primaryColor || '#3B82F6'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, primaryColor: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={form.theme?.backgroundColor || '#FFFFFF'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, backgroundColor: e.target.value }
                }))}
                className="w-12 h-10 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={form.theme?.backgroundColor || '#FFFFFF'}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  theme: { ...prev.theme!, backgroundColor: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={form.theme?.fontFamily || 'Inter'}
            onChange={(e) => setForm(prev => ({
              ...prev,
              theme: { ...prev.theme!, fontFamily: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Form Preview</h1>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
            >
              Back to Editor
            </button>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
              <p className="text-gray-600">{form.description}</p>
            </div>
            
            <form className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldPreview(field)}
                </div>
              ))}
              
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col md:flex-row">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-gray-600 hover:text-blue-600"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Field Types */}
      <div className={`${mobileSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white border-r border-gray-200 p-4 shadow-lg fixed md:relative inset-0 z-30 md:z-0 overflow-y-auto`}>
        <div className="md:mb-4">
          <button
            onClick={onBack}
            className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Close button for mobile */}
        <div className="flex justify-end md:hidden mb-4">
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowAIBuilder(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-purple-50 rounded-lg transition-colors text-purple-700 border border-purple-200"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI Form Builder</span>
            </button>
            <button
              onClick={() => {
                setShowTemplates(true);
                setMobileSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors text-blue-700 border border-blue-200"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Use Template</span>
            </button>
          </div>
        </div>
        
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Fields</h2>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <button
                key={fieldType.type}
                onClick={() => {
                  addField(fieldType.type as FormField['type']);
                  setMobileSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
              >
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm">{fieldType.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col mb-20 md:mb-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg md:text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 w-full max-w-xs"
              />
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                form.status === 'published' ? 'bg-green-100 text-green-800' :
                form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {form.status}
              </span>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setPreviewMode(true)}
                className="flex items-center space-x-1 md:space-x-2 p-2 md:px-4 md:py-2 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-300"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden md:inline">Preview</span>
              </button>
              <button 
                onClick={saveForm}
                disabled={saving}
                className="flex items-center space-x-1 md:space-x-2 p-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
                title="Save"
              >
                <Save className="w-4 h-4" />
                <span className="hidden md:inline">{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button 
                onClick={publishForm}
                disabled={publishing || !form._id}
                className="flex items-center space-x-1 md:space-x-2 p-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-lg"
                title="Publish"
              >
                <Send className="w-4 h-4" />
                <span className="hidden md:inline">{publishing ? 'Publishing...' : 'Publish'}</span>
              </button>
              {form.status === 'published' && form.shareUrl && (
                <>
                  <button
                    onClick={copyShareLink}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => setShowEmbedCode(true)}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow-lg"
                  >
                    <Code className="w-4 h-4" />
                    <span>Embed</span>
                  </button>
                  <button
                    onClick={() => setShowIntegrations(true)}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Integrations</span>
                  </button>
                  <button
                    onClick={() => setShowAnalytics(true)}
                    className="hidden md:flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 overflow-x-auto">
          <div className="flex space-x-4 md:space-x-8 min-w-max">
            {[
              { id: 'fields', label: 'Fields', icon: Type },
              { id: 'logic', label: 'Logic', icon: GitBranch },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Form Builder */}
          <div className="flex-1 p-4 md:p-6">
            {activeTab === 'fields' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
                  <div className="mb-6 md:mb-8">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="text-xl md:text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 w-full"
                      placeholder="Form Title"
                    />
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="text-gray-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 w-full mt-2 resize-none"
                      placeholder="Form description"
                      rows={2}
                    />
                  </div>

                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {form.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-xl p-4 bg-white transition-all shadow-sm ${
                                    selectedField === field.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                  } ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                                  onClick={() => {
                                    setSelectedField(field.id);
                                    setMobileFieldEditorOpen(true);
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div {...provided.dragHandleProps} className="cursor-move">
                                      <div className="flex space-x-1">
                                        <div className="w-1 h-4 bg-gray-300 rounded"></div>
                                        <div className="w-1 h-4 bg-gray-300 rounded"></div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedField(field.id);
                                        setMobileFieldEditorOpen(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {renderFieldPreview(field)}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {form.fields.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No fields added yet</p>
                              <p className="text-sm">Add fields from the sidebar to get started</p>
                              <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 md:hidden"
                              >
                                Open Field Library
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>
            )}

            {activeTab === 'logic' && (
              <div className="max-w-4xl mx-auto">
                <ConditionalLogic
                  fields={form.fields}
                  rules={form.conditionalRules || []}
                  onRulesChange={(rules) => setForm(prev => ({ ...prev, conditionalRules: rules }))}
                />
              </div>
            )}

            {activeTab === 'design' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
                  {renderDesignTab()}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
                  <h3 className="text-lg font-semibold mb-4">Form Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowMultiple"
                        checked={formSettings.allowMultipleResponses}
                        onChange={(e) => setFormSettings(prev => ({ 
                          ...prev, 
                          allowMultipleResponses: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="allowMultiple" className="text-sm font-medium text-gray-700">
                        Allow multiple responses from same user
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requireLogin"
                        checked={formSettings.requireLogin}
                        onChange={(e) => setFormSettings(prev => ({ 
                          ...prev, 
                          requireLogin: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="requireLogin" className="text-sm font-medium text-gray-700">
                        Require login to submit
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showProgress"
                        checked={formSettings.showProgressBar}
                        onChange={(e) => setFormSettings(prev => ({ 
                          ...prev, 
                          showProgressBar: e.target.checked 
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="showProgress" className="text-sm font-medium text-gray-700">
                        Show progress bar
                      </label>
                    </div>
                    
                    {formSettings.requireLogin && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Login Required</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Users must be signed in to submit responses to this form.
                        </p>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Notification Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                            Email notifications for new responses
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="responseLimit"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="responseLimit" className="text-sm font-medium text-gray-700">
                            Limit number of responses
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Form Behavior</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="shuffleQuestions"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">
                            Randomize question order
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="confirmationPage"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="confirmationPage" className="text-sm font-medium text-gray-700">
                            Show confirmation page after submission
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Field Editor */}
          {activeTab === 'fields' && renderFieldEditor()}
        </div>
      </div>

      {/* Modals */}
      {showAIBuilder && (
        <AIFormBuilder
          onFormGenerated={handleAIFormGenerated}
          onClose={() => setShowAIBuilder(false)}
        />
      )}

      {showTemplates && (
        <TemplateLibrary
          onSelectTemplate={handleTemplateSelected}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showEmbedCode && form.shareUrl && (
        <EmbedCodeGenerator
          form={form}
          onClose={() => setShowEmbedCode(false)}
        />
      )}

      {showIntegrations && form._id && (
        <IntegrationsPanel
          formId={form._id}
          onClose={() => setShowIntegrations(false)}
        />
      )}

      {showAnalytics && form._id && (
        <FormAnalytics
          formId={form._id}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around items-center shadow-lg z-20">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-3 text-gray-600 hover:text-blue-600 flex flex-col items-center"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs mt-1">Add Field</span>
        </button>
        <button
          onClick={() => setPreviewMode(true)}
          className="p-3 text-gray-600 hover:text-blue-600 flex flex-col items-center"
        >
          <Eye className="w-5 h-5" />
          <span className="text-xs mt-1">Preview</span>
        </button>
        <button
          onClick={saveForm}
          disabled={saving}
          className="p-3 text-blue-600 hover:text-blue-700 flex flex-col items-center disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span className="text-xs mt-1">Save</span>
        </button>
        {selectedField && (
          <button
            onClick={() => setMobileFieldEditorOpen(true)}
            className="p-3 text-purple-600 hover:text-purple-700 flex flex-col items-center"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedFormBuilder;