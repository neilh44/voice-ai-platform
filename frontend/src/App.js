import './index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import your components
import Dashboard from './components/Dashboard';
import CallLogs from './components/CallLogs';
import Appointments from './components/Appointments';
import KnowledgeBase from './components/KnowledgeBase';
import ScriptEditor from './components/ScriptEditor';
import ConfigForm from './components/ConfigForm';
import Login from './components/Login';

// Import CSS
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/call-logs" element={<CallLogs />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/knowledge/upload" element={<KnowledgeBase />} />
        <Route path="/scripts" element={<ScriptEditor />} />
        <Route path="/config" element={<ConfigForm />} />
      </Routes>
    </Router>
  );
}

export default App;