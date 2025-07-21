import React from 'react';
import { User, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout, getInitials } = useAuth();
  const { forms } = useFormData();

  const totalResponses = forms.reduce((sum, form) => sum + (form.responses || 0), 0);
  const totalViews = forms.reduce((sum, form) => sum + (form.views || 0), 0);
  const activeForms = forms.filter(form => form.status === 'published').length;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
              {getInitials()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{forms.length}</div>
            <div className="text-xs text-gray-500">Total Forms</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{totalResponses}</div>
            <div className="text-xs text-gray-500">Responses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{totalViews}</div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{activeForms}</div>
            <div className="text-xs text-gray-500">Published</div>
          </div>
        </div>
      </div>

      <div className="py-2">
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors">
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <div className="border-t border-gray-100 my-2"></div>
        <button 
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;