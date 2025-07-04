import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Trash2, Calendar, Clock, User } from 'lucide-react';
import { responseAPI, exportAPI, formAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Response {
  _id: string;
  responses: Array<{
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    value: any;
  }>;
  submittedAt: string;
  completionTime?: number;
}

interface Form {
  _id: string;
  title: string;
  description: string;
}

interface ResponseViewerProps {
  formId: string;
  onBack: () => void;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadForm();
    loadResponses();
  }, [formId, currentPage]);

  const loadForm = async () => {
    try {
      const response = await formAPI.getForm(formId);
      setForm(response.data);
    } catch (error) {
      toast.error('Failed to load form');
      console.error('Error loading form:', error);
    }
  };

  const loadResponses = async () => {
    try {
      const response = await responseAPI.getResponses(formId, currentPage, 10);
      setResponses(response.data.responses);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      toast.error('Failed to load responses');
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) {
      return;
    }

    try {
      await responseAPI.deleteResponse(responseId);
      setResponses(responses.filter(r => r._id !== responseId));
      toast.success('Response deleted successfully');
    } catch (error) {
      toast.error('Failed to delete response');
      console.error('Error deleting response:', error);
    }
  };

  const downloadExcel = () => {
    exportAPI.downloadExcel(formId);
    toast.success('Excel download started');
  };

  const downloadCSV = () => {
    exportAPI.downloadCSV(formId);
    toast.success('CSV download started');
  };

  const formatValue = (value: any, fieldType: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (fieldType === 'rating') {
      return `${value}/5 stars`;
    }
    return value?.toString() || 'No answer';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{form?.title}</h1>
                <p className="text-gray-600">{responses.length} responses</p>
              </div>
            </div>
            
            {responses.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {responses.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600">
              Share your form to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Response #{(currentPage - 1) * 10 + index + 1}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(response.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(response.submittedAt).toLocaleTimeString()}</span>
                      </div>
                      {response.completionTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{response.completionTime}s completion</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteResponse(response._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete response"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {response.responses.map((fieldResponse, fieldIndex) => (
                    <div key={fieldIndex} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {fieldResponse.fieldLabel}
                      </h4>
                      <p className="text-gray-700">
                        {formatValue(fieldResponse.value, fieldResponse.fieldType)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseViewer;