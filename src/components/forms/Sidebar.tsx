import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileText, 
  Clock, 
  User, 
  LogOut, 
  Plus,
  Folder,
  ChevronRight,
  Settings,
  Menu,
  Star,
  ChevronLeft
} from 'lucide-react';
import { formAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RecentForm {
  _id: string;
  title: string;
  updatedAt: string;
  status: string;
}

interface SidebarProps {
  onCreateForm: () => void;
  onEditForm: (id: string) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onToggle?: (minimized: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onCreateForm, 
  onEditForm, 
  currentView,
  onNavigate,
  onToggle 
}) => {
  const { user, logout, getInitials } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentForms, setRecentForms] = useState<RecentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    loadRecentForms();
  }, []);

  useEffect(() => {
    // Notify parent component about sidebar state change
    if (onToggle) {
      onToggle(isMinimized);
    }
  }, [isMinimized, onToggle]);

  const loadRecentForms = async () => {
    try {
      const response = await formAPI.getRecentForms(20); // Get more forms to fill groups
      setRecentForms(response.data);
    } catch (error) {
      console.error('Error loading recent forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    // Redirect to login page or home
    window.location.href = '/login';
  };

  const handleToggle = () => {
    setIsMinimized(!isMinimized);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeCategory = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return 'today';
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    }

    // Check if it's within last 7 days
    if (diffDays <= 7) {
      return 'last7days';
    }

    // Check if it's within last 30 days
    if (diffDays <= 30) {
      return 'lastMonth';
    }

    return 'older';
  };

  const groupFormsByTime = (forms: RecentForm[]) => {
    const groups: { [key: string]: RecentForm[] } = {
      today: [],
      yesterday: [],
      last7days: [],
      lastMonth: [],
      older: []
    };

    forms.forEach(form => {
      const category = getTimeCategory(form.updatedAt);
      groups[category].push(form);
    });

    return groups;
  };

  const getGroupTitle = (groupKey: string) => {
    switch (groupKey) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7days': return 'Last 7 days';
      case 'lastMonth': return 'Last month';
      case 'older': return 'Older';
      default: return '';
    }
  };

  const filteredForms = recentForms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedForms = groupFormsByTime(filteredForms);

  if (!user) {
    return (
      <div className={`${isMinimized ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-screen flex items-center justify-center transition-all duration-300`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Minimized version
  if (isMinimized) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300">
        {/* Logo - Minimized */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={handleToggle}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation Icons */}
        <div className="flex-1 p-3 space-y-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Dashboard"
          >
            <Folder className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={onCreateForm}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Create Form"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User Profile - Minimized */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex flex-col items-center space-y-2">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {getInitials()}
              </div>
            )}
            
            <div className="flex flex-col space-y-1 w-full">
              <button 
                className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Forms</h1>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            title="Minimize sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
          />
        </div>
      </div>

      {/* Recent Forms */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Recent forms</h3>
          <Clock className="w-4 h-4 text-gray-400" />
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredForms.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedForms).map(([groupKey, forms]) => {
              if (forms.length === 0) return null;
              
              return (
                <div key={groupKey} className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
                    {getGroupTitle(groupKey)}
                  </h4>
                  <div className="space-y-1">
                    {forms.map((form) => (
                      <button
                        key={form._id}
                        onClick={() => onEditForm(form._id)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {form.title}
                            </p>
                            {/* <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}>
                                {form.status}
                              </span>
                            </div> */}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchTerm ? 'No forms found' : 'No recent forms'}
            </p>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {getInitials()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;