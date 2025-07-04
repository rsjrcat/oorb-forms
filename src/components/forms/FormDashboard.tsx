import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Share2,
  BarChart3,
  Users,
  Calendar,
  FileText,
  Download,
  Send
} from 'lucide-react';
import { formAPI, exportAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface FormItem {
  _id: string;
  title: string;
  description: string;
  responses: number;
  views: number;
  createdAt: string;
  status: 'active' | 'draft' | 'closed';
  shareUrl?: string;
}

interface FormDashboardProps {
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  onViewResponses: (id: string) => void;
}

const FormDashboard: React.FC<FormDashboardProps> = ({ 
  onCreateForm, 
  onEditForm,
  onViewResponses 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const response = await formAPI.getForms();
      setForms(response.data);
    } catch (error) {
      toast.error('Failed to load forms');
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      await formAPI.deleteForm(formId);
      setForms(forms.filter(form => form._id !== formId));
      toast.success('Form deleted successfully');
    } catch (error) {
      toast.error('Failed to delete form');
      console.error('Error deleting form:', error);
    }
  };

  const copyShareLink = (shareUrl: string) => {
    const shareLink = `${window.location.origin}/form/${shareUrl}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard!');
  };

  const downloadExcel = (formId: string) => {
    exportAPI.downloadExcel(formId);
    toast.success('Excel download started');
  };

  const downloadCSV = (formId: string) => {
    exportAPI.downloadCSV(formId);
    toast.success('CSV download started');
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || form.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalResponses = forms.reduce((sum, form) => sum + form.responses, 0);
  const totalViews = forms.reduce((sum, form) => sum + form.views, 0);
  const activeForms = forms.filter(form => form.status === 'published').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ">
          <div className="flex items-center justify-between mt-14">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forms Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and analyze your forms</p>
            </div>
            <button
              onClick={onCreateForm}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Form
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published Forms</p>
                <p className="text-2xl font-bold text-gray-900">{activeForms}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Forms</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredForms.map((form) => (
              <div key={form._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{form.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}>
                        {form.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{form.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>{form.responses} responses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{form.views} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditForm(form._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      title="Edit form"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onViewResponses(form._id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      title="View responses"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    
                    {form.status === 'published' && form.shareUrl && (
                      <button
                        onClick={() => copyShareLink(form.shareUrl!)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Copy share link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {form.responses > 0 && (
                      <div className="relative group">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                          <Download className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => downloadExcel(form._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Download Excel
                          </button>
                          <button
                            onClick={() => downloadCSV(form._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Download CSV
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => deleteForm(form._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredForms.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first form'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={onCreateForm}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormDashboard;