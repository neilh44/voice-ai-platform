// services/api.js
import axios from 'axios';

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authentication token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Configuration APIs
export const getUserConfig = async (userId) => {
  try {
    const response = await api.get(`/user/config/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user config:', error);
    throw error;
  }
};

export const saveUserConfig = async (configData) => {
  try {
    const response = await api.post('/user/config', configData);
    return response.data;
  } catch (error) {
    console.error('Error saving user config:', error);
    throw error;
  }
};

// Knowledge Base APIs
export const getKnowledgeBases = async (userId) => {
  try {
    const response = await api.get(`/knowledge/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    throw error;
  }
};

export const uploadKnowledgeBase = async (formData) => {
  try {
    const response = await api.post('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading knowledge base:', error);
    throw error;
  }
};

export const deleteKnowledgeBase = async (knowledgeBaseId) => {
  try {
    const response = await api.delete(`/knowledge/${knowledgeBaseId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting knowledge base:', error);
    throw error;
  }
};

// Script APIs
export const getScripts = async (userId) => {
  try {
    const response = await api.get(`/scripts/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scripts:', error);
    throw error;
  }
};

export const saveScript = async (scriptData) => {
  try {
    const response = await api.post('/scripts', scriptData);
    return response.data;
  } catch (error) {
    console.error('Error saving script:', error);
    throw error;
  }
};

export const deleteScript = async (scriptId) => {
  try {
    const response = await api.delete(`/scripts/${scriptId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting script:', error);
    throw error;
  }
};

// Appointment APIs
export const getAppointments = async (userId) => {
  try {
    const response = await api.get(`/appointments/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId) => {
  try {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Call Log APIs
export const getCallLogs = async (userId, filters = {}) => {
  try {
    const response = await api.get(`/call-logs/${userId}`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching call logs:', error);
    throw error;
  }
};

// Dashboard Summary API
export const getSystemSummary = async (userId) => {
  try {
    const response = await api.get(`/dashboard/summary/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system summary:', error);
    
    // Return mock data for demo purposes when backend is not available
    return {
      configurationComplete: false,
      twilioConfigured: false,
      llmConfigured: false,
      deepgramConfigured: false,
      callsThisMonth: 0,
      callsToday: 0,
      appointmentsToday: 0,
      upcomingAppointments: 0,
      knowledgeBaseCount: 0,
      scriptCount: 0,
      recentCalls: [],
      recentAppointments: []
    };
  }
};

// Auth APIs
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export default api;