import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Dashboard from './components/Dashboard';
import ConfigForm from './components/ConfigForm';
import KnowledgeBase from './components/KnowledgeBase';
import ScriptEditor from './components/ScriptEditor';
import Appointments from './components/Appointments';
import CallLogs from './components/CallLogs';
import Login from './components/Login';
import Navbar from './components/Navbar';

// Context
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth_token') ? true : false
  );

  const handleLogin = (token) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider value={{ isAuthenticated, handleLogin, handleLogout }}>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {isAuthenticated && <Navbar onLogout={handleLogout} />}
            <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
              <Routes>
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Dashboard />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    !isAuthenticated ? (
                      <Login onLogin={handleLogin} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route
                  path="/config"
                  element={
                    isAuthenticated ? (
                      <ConfigForm />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/knowledge"
                  element={
                    isAuthenticated ? (
                      <KnowledgeBase />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/scripts"
                  element={
                    isAuthenticated ? (
                      <ScriptEditor />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    isAuthenticated ? (
                      <Appointments />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/call-logs"
                  element={
                    isAuthenticated ? (
                      <CallLogs />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Routes>
            </Container>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;