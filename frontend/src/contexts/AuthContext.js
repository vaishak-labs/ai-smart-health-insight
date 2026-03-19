import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      verifyToken();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      // Token is invalid, clear it
      logout();
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    const response = await axios.post(`${API}/auth/signup`, {
      name,
      email,
      password
    });
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return userData;
  };

  const signin = async (email, password) => {
    const response = await axios.post(`${API}/auth/signin`, {
      email,
      password
    });
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const forgotPassword = async (email) => {
    const response = await axios.post(`${API}/auth/forgot-password`, { email });
    return response.data;
  };

  const resetPassword = async (token, newPassword) => {
    const response = await axios.post(`${API}/auth/reset-password`, {
      token,
      new_password: newPassword
    });
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    signup,
    signin,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
