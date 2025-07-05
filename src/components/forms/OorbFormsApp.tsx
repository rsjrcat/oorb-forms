import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import FormDashboard from './FormDashboard';
import FormBuilder from './FormBuilder';
import ResponseViewer from './ResponseViewer';
import FormCreationModal from './FormCreationModal';
import Sidebar from './Sidebar';
import { formAPI } from '../../services/api';
import toast from 'react-hot-toast';

type View = 'dashboard' | 'builder' | 'responses';

const OorbFormsApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [showFormCreationModal, setShowFormCreationModal] = useState(false);

  const handleCreateForm = () => {
    setShowFormCreationModal(true);
  };

  const handleFormCreation = async (data: { title: string; description: string; folderId?: string }) => {
    try {
      const formData = {
        title: data.title,
        description: data.description,
        folderId: data.folderId || null,
        fields: [],
        status: 'draft'
      };
      
      const response = await formAPI.createForm(formData);
      setCurrentFormId(response.data._id);
      setCurrentView('builder');
      toast.success('Form created successfully!');
    } catch (error) {
      toast.error('Failed to create form');
      console.error('Error creating form:', error);
    }
  };

  const handleEditForm = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('builder');
  };

  const handleViewResponses = (formId: string) => {
    setCurrentFormId(formId);
    setCurrentView('responses');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentFormId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
              onCreateForm={handleCreateForm}
              onEditForm={handleEditForm}
              currentView={currentView}
              onNavigate={setCurrentView}
            />
            
            {/* Main Content */}
            <div className="flex-1">
              <FormDashboard 
                onCreateForm={handleCreateForm}
                onEditForm={handleEditForm}
                onViewResponses={handleViewResponses}
              />
            </div>
          </div>
        );
      
      case 'builder':
        return (
          <FormBuilder 
            formId={currentFormId || undefined}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'responses':
        return currentFormId ? (
          <ResponseViewer 
            formId={currentFormId}
            onBack={handleBackToDashboard}
          />
        ) : null;
      
      default:
        return (
          <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
              onCreateForm={handleCreateForm}
              onEditForm={handleEditForm}
              currentView={currentView}
              onNavigate={setCurrentView}
            />
            
            
            {/* Main Content */}
            <div className="flex-1">
              <FormDashboard 
                onCreateForm={handleCreateForm}
                onEditForm={handleEditForm}
                onViewResponses={handleViewResponses}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderCurrentView()}

      {/* Form Creation Modal */}
      <FormCreationModal
        isOpen={showFormCreationModal}
        onClose={() => setShowFormCreationModal(false)}
        onSubmit={handleFormCreation}
      />

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
};

export default OorbFormsApp;