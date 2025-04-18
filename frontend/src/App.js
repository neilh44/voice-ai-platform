import './index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your components
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import CallLogs from './components/CallLogs';
import Appointments from './components/Appointments';
import KnowledgeBase from './components/KnowledgeBase';
import ScriptEditor from './components/ScriptEditor';
import ConfigForm from './components/ConfigForm';
import Login from './components/Login';

function App() {
  // Simple authentication check (you'd replace this with your actual auth logic)
  const isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true';
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    
    return <AppLayout>{children}</AppLayout>;
  };

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes with AppLayout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/call-management" element={
          <ProtectedRoute>
            <CallLogs />
          </ProtectedRoute>
        } />
        
        <Route path="/call-logs" element={
          <ProtectedRoute>
            <CallLogs />
          </ProtectedRoute>
        } />
        
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge" element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        } />
        
        <Route path="/knowledge/upload" element={
          <ProtectedRoute>
            <KnowledgeBase isUploadView={true} />
          </ProtectedRoute>
        } />
        
        <Route path="/scripts" element={
          <ProtectedRoute>
            <ScriptEditor />
          </ProtectedRoute>
        } />
        
        <Route path="/configuration" element={
          <ProtectedRoute>
            <ConfigForm />
          </ProtectedRoute>
        } />
        
        {/* Logout route */}
        <Route path="/logout" element={
          <Navigate to="/login" replace />
        } />
        
        {/* Redirect any unmatched routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;