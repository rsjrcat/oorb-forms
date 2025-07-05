import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<boolean>;
  getInitials: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        console.log('Auth check successful', response.data);
      } catch (error) {
        console.error('Token validation failed', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  } finally {
    setLoading(false);
  }
};

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      
      console.log('Login response:', { token: token ? 'received' : 'missing', user: userData });
      
      // Store token with consistent key
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state
      setUser(userData);
      
      toast.success('Login successful!');
      console.log('User state updated successfully');
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', email);
      const response = await authAPI.register({ name, email, password });
      const { token, user: userData } = response.data;
      
      console.log('Registration response:', { token: token ? 'received' : 'missing', user: userData });
      
      // Store token with consistent key
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state
      setUser(userData);
      
      toast.success('Registration successful!');
      console.log('User state updated successfully');
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Profile update failed');
      return false;
    }
  };

  const getInitials = (): string => {
    if (!user) return 'U';
    return user.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    getInitials
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};