import React from 'react';
import { ArrowLeft, X, FolderOpen } from 'lucide-react';
import { useDashboard } from './DashboardContext';
import { useFormData } from './FormDataContext';
import FileItem from './FileItem';

const FolderContentsModal: React.FC = () => {
  const { openFolderModal, setOpenFolderModal } = useDashboard();
  const { getFormsInFolder } = useFormData();

  if (!openFolderModal) return null;

  const formsInFolder = getFormsInFolder(openFolderModal._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setOpenFolderModal(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: openFolderModal.color + '20' }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: openFolderModal.color }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{openFolderModal.name}</h2>
                <p className="text-sm text-gray-600">{formsInFolder.length} items</p>
              </div>
            </div>
            <button
              onClick={() => setOpenFolderModal(null)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {formsInFolder.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {formsInFolder.map((form) => (
                <FileItem
                  key={`form-${form._id}`}
                  item={form}
                  type="form"
                  onEdit={onEditForm}
                  onViewResponses={onViewResponses}
                  onDelete={onDeleteForm}
                  onCopyShareLink={onCopyShareLink}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">This folder is empty</h3>
              <p className="text-gray-600">Add forms to organize them</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderContentsModal;