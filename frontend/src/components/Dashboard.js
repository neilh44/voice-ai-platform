import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  Button,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Settings as SettingsIcon,
  Description as FileIcon,
  Code as CodeIcon,
  Event as EventIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon,
  TrendingUp as TrendingUpIcon,
  CloudUpload as UploadIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getSystemSummary } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    configurationComplete: false,
    callsThisMonth: 0,
    callsToday: 0,
    appointmentsToday: 0,
    upcomingAppointments: 0,
    knowledgeBaseCount: 0,
    scriptCount: 0,
    recentCalls: [],
    recentAppointments: [],
    twilioConfigured: false,
    llmConfigured: false,
    deepgramConfigured: false
  });
  
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetchSummary();
  }, [userId, retryCount]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await getSystemSummary(userId);
      setSummary(data);
      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const getSetupSteps = () => {
    const steps = [];
    
    if (!summary.twilioConfigured) {
      steps.push({
        label: 'Configure Twilio',
        description: 'Set up your Twilio account to handle phone calls',
        path: '/config',
        icon: <PhoneIcon />
      });
    }
    
    if (!summary.llmConfigured) {
      steps.push({
        label: 'Configure LLM',
        description: 'Connect an AI language model provider',
        path: '/config',
        icon: <CodeIcon />
      });
    }
    
    if (!summary.deepgramConfigured) {
      steps.push({
        label: 'Configure Deepgram',
        description: 'Set up speech-to-text and text-to-speech',
        path: '/config',
        icon: <SettingsIcon />
      });
    }
    
    if (summary.knowledgeBaseCount === 0) {
      steps.push({
        label: 'Add Knowledge Base',
        description: 'Upload documents for your AI to reference',
        path: '/knowledge',
        icon: <UploadIcon />
      });
    }
    
    if (summary.scriptCount === 0) {
      steps.push({
        label: 'Create a Script',
        description: 'Define how your AI assistant will interact',
        path: '/scripts',
        icon: <FileIcon />
      });
    }
    
    return steps;
  };
  
  const setupSteps = getSetupSteps();
  const isSetupComplete = setupSteps.length === 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Voice AI Dashboard
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRetry} 
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error.includes('completed_at') && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              There appears to be a database schema issue. Please contact your administrator.
            </Typography>
          )}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Setup Status */}
          {!isSetupComplete && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Complete Your Setup
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Complete these steps to fully set up your Voice AI platform
                </Typography>
                
                <List>
                  {setupSteps.map((step, index) => (
                    <ListItem 
                      key={index} 
                      button 
                      component={RouterLink} 
                      to={step.path}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        {step.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={step.label} 
                        secondary={step.description} 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
          
          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Calls Today
                  </Typography>
                  <Typography variant="h4">
                    {summary.callsToday}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CallReceivedIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                      {summary.callsThisMonth} this month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Appointments Today
                  </Typography>
                  <Typography variant="h4">
                    {summary.appointmentsToday}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <EventIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                      {summary.upcomingAppointments} upcoming
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Knowledge Bases
                  </Typography>
                  <Typography variant="h4">
                    {summary.knowledgeBaseCount}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <FileIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                      {summary.knowledgeBaseCount > 0 ? 'AI ready' : 'Add documents'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    AI Scripts
                  </Typography>
                  <Typography variant="h4">
                    {summary.scriptCount}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CodeIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                      {summary.scriptCount > 0 ? 'Interaction defined' : 'Create a script'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Recent Activity */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Calls
                  </Typography>
                  
                  {summary.recentCalls.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                      {error 
                        ? 'Call data temporarily unavailable. Please try refreshing.'
                        : 'No recent calls. Configure your Twilio number to receive calls.'}
                    </Typography>
                  ) : (
                    <List>
                      {summary.recentCalls.map((call) => (
                        <ListItem key={call.id}>
                          <ListItemIcon>
                            <PhoneIcon color={call.outcome === 'completed' ? 'success' : 'error'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={call.fromNumber}
                            secondary={`${call.duration}s • ${new Date(call.startedAt).toLocaleString()}`}
                          />
                          <ListItemSecondaryAction>
                            <Chip 
                              size="small" 
                              label={call.outcome} 
                              color={call.outcome === 'completed' ? 'success' : 'error'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                      component={RouterLink} 
                      to="/call-logs"
                      color="primary"
                    >
                      View All Calls
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Appointments
                  </Typography>
                  
                  {summary.recentAppointments.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                      No upcoming appointments. Schedule some or wait for calls.
                    </Typography>
                  ) : (
                    <List>
                      {summary.recentAppointments.map((appointment) => (
                        <ListItem key={appointment.id}>
                          <ListItemIcon>
                            <EventIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={appointment.customerName}
                            secondary={`${appointment.appointmentDate} at ${appointment.appointmentTime}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                      component={RouterLink} 
                      to="/appointments"
                      color="primary"
                    >
                      Manage Appointments
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;