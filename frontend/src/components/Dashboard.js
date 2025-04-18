import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from './AppLayout';

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

// Lucide icons
import { 
  Phone, 
  Settings, 
  FileText, 
  Code, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Upload, 
  RefreshCw,
  XCircle
} from "lucide-react";

// API service remains the same
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
        icon: <Phone className="h-5 w-5" />
      });
    }
    
    if (!summary.llmConfigured) {
      steps.push({
        label: 'Configure LLM',
        description: 'Connect an AI language model provider',
        path: '/config',
        icon: <Code className="h-5 w-5" />
      });
    }
    
    if (!summary.deepgramConfigured) {
      steps.push({
        label: 'Configure Deepgram',
        description: 'Set up speech-to-text and text-to-speech',
        path: '/config',
        icon: <Settings className="h-5 w-5" />
      });
    }
    
    if (summary.knowledgeBaseCount === 0) {
      steps.push({
        label: 'Add Knowledge Base',
        description: 'Upload documents for your AI to reference',
        path: '/knowledge',
        icon: <Upload className="h-5 w-5" />
      });
    }
    
    if (summary.scriptCount === 0) {
      steps.push({
        label: 'Create a Script',
        description: 'Define how your AI assistant will interact',
        path: '/scripts',
        icon: <FileText className="h-5 w-5" />
      });
    }
    
    return steps;
  };
  
  const setupSteps = getSetupSteps();
  const isSetupComplete = setupSteps.length === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Voice AI Dashboard</h2>
          <Button 
            variant="outline" 
            onClick={handleRetry} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error}
              {error.includes('completed_at') && (
                <p className="text-xs mt-1">
                  There appears to be a database schema issue. Please contact your administrator.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        ) : (
          <>
            {/* Setup Status */}
            {!isSetupComplete && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Complete Your Setup</CardTitle>
                  <CardDescription>
                    Complete these steps to fully set up your Voice AI platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {setupSteps.map((step, index) => (
                      <Link 
                        key={index} 
                        to={step.path}
                        className="block"
                      >
                        <div className="flex items-start p-3 rounded-md hover:bg-muted transition-colors">
                          <div className="mr-4 mt-0.5 text-primary">
                            {step.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{step.label}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.callsToday}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <ArrowDownRight className="h-4 w-4 mr-1 text-primary" />
                    <span>{summary.callsThisMonth} this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.appointmentsToday}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4 mr-1 text-primary" />
                    <span>{summary.upcomingAppointments} upcoming</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Bases</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.knowledgeBaseCount}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <FileText className="h-4 w-4 mr-1 text-primary" />
                    <span>{summary.knowledgeBaseCount > 0 ? 'AI ready' : 'Add documents'}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Scripts</CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.scriptCount}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Code className="h-4 w-4 mr-1 text-primary" />
                    <span>{summary.scriptCount > 0 ? 'Interaction defined' : 'Create a script'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.recentCalls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Phone className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {error 
                          ? 'Call data temporarily unavailable. Please try refreshing.'
                          : 'No recent calls. Configure your Twilio number to receive calls.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {summary.recentCalls.map((call) => (
                        <div key={call.id} className="flex items-center">
                          <div className="mr-4">
                            <Phone className={`h-5 w-5 ${call.outcome === 'completed' ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{call.fromNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {`${call.duration}s • ${new Date(call.startedAt).toLocaleString()}`}
                            </p>
                          </div>
                          <Badge variant={call.outcome === 'completed' ? 'outline' : 'destructive'} className="ml-2">
                            {call.outcome}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="ghost" asChild>
                    <Link to="/call-logs" className="flex items-center">
                      View All Calls
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.recentAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No upcoming appointments. Schedule some or wait for calls.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {summary.recentAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center">
                          <div className="mr-4">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{appointment.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {`${appointment.appointmentDate} at ${appointment.appointmentTime}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="ghost" asChild>
                    <Link to="/appointments" className="flex items-center">
                      Manage Appointments
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;