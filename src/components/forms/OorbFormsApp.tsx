import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import FormDashboard from './FormDashboard';
import FormBuilder from './FormBuilder';
import ResponseViewer from './ResponseViewer';

type View = 'dashboard' | 'builder' | 'responses';

const OorbFormsApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);

  const handleCreateForm = () => {
    setCurrentFormId(null);
    setCurrentView('builder');
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
          <FormDashboard 
            onCreateForm={handleCreateForm}
            onEditForm={handleEditForm}
            onViewResponses={handleViewResponses}
          />
        );
      
      case 'builder':
        return (<>
        <div className='mt-14'>
          <FormBuilder 
            formId={currentFormId || undefined}
            onBack={handleBackToDashboard}
          /></div>
          </>
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
          <FormDashboard 
            onCreateForm={handleCreateForm}
            onEditForm={handleEditForm}
            onViewResponses={handleViewResponses}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentView()}
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