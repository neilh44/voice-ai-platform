import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material';
import { getScripts, saveScript } from '../services/api';

const ScriptEditor = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scripts, setScripts] = useState([]);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResponse, setTestResponse] = useState('');

  // Current script being edited
  const [currentScript, setCurrentScript] = useState({
    scriptName: '',
    scriptContent: JSON.stringify({
      greeting: "Hello, thank you for calling. How can I assist you today?",
      farewell: "Thank you for calling. Have a great day!",
      appointment_confirmation: "Great, I've scheduled your appointment for {date} at {time}. Is there anything else you need?",
      appointment_request: "I'd be happy to schedule an appointment. What date and time works best for you?",
      fallback_responses: [
        "I'm sorry, I didn't catch that. Could you please repeat?",
        "I'm having trouble understanding. Could you phrase that differently?"
      ],
      entities_to_collect: {
        name: {
          prompt: "May I have your name, please?",
          validation: "name_validation"
        },
        phone: {
          prompt: "What's the best phone number to reach you?",
          validation: "phone_validation"
        },
        appointment_date: {
          prompt: "What date would you like to schedule your appointment for?",
          validation: "date_validation"
        },
        appointment_time: {
          prompt: "What time works best for you?",
          validation: "time_validation"
        }
      }
    }, null, 2)
  });

  useEffect(() => {
    fetchScripts();
  }, [userId]);

  const fetchScripts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getScripts(userId);
      setScripts(data);
    } catch (err) {
      setError('Failed to load scripts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScriptNameChange = (e) => {
    setCurrentScript({
      ...currentScript,
      scriptName: e.target.value
    });
  };

  const handleScriptContentChange = (e) => {
    setCurrentScript({
      ...currentScript,
      scriptContent: e.target.value
    });
  };

  const handleScriptSelect = (script) => {
    setCurrentScript({
      scriptName: script.scriptName,
      scriptContent: JSON.stringify(JSON.parse(script.scriptContent), null, 2)
    });
  };

  const handleNewScript = () => {
    setCurrentScript({
      scriptName: 'New Script',
      scriptContent: JSON.stringify({
        greeting: "Hello, thank you for calling. How can I assist you today?",
        appointment_request: "I'd be happy to schedule an appointment. What date and time works best for you?",
        fallback_responses: [
          "I'm sorry, I didn't catch that. Could you please repeat?",
          "I'm having trouble understanding. Could you phrase that differently?"
        ],
        entities_to_collect: {
          name: {
            prompt: "May I have your name, please?",
            validation: "name_validation"
          },
          phone: {
            prompt: "What's the best phone number to reach you?",
            validation: "phone_validation"
          },
          appointment_date: {
            prompt: "What date would you like to schedule your appointment for?",
            validation: "date_validation"
          },
          appointment_time: {
            prompt: "What time works best for you?",
            validation: "time_validation"
          }
        }
      }, null, 2)
    });
  };

  const handleSaveScript = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!currentScript.scriptName) {
      setError('Script name is required');
      return;
    }

    // Validate JSON
    try {
      JSON.parse(currentScript.scriptContent);
    } catch (e) {
      setError('Invalid JSON in script content');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveScript({
        userId,
        scriptName: currentScript.scriptName,
        scriptContent: currentScript.scriptContent
      });
      
      setSuccess('Script saved successfully!');
      fetchScripts(); // Refresh the list
    } catch (err) {
      setError('Failed to save script: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestScript = () => {
    try {
      const scriptObj = JSON.parse(currentScript.scriptContent);
      setTestResponse(scriptObj.greeting);
      setTestDialogOpen(true);
    } catch (e) {
      setError('Invalid JSON in script content');
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Voice AI Script Editor
      </Typography>
      
      <Grid container spacing={3}>
        {/* Script List */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Saved Scripts</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleNewScript}
                  size="small"
                >
                  New
                </Button>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {scripts.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No scripts found" secondary="Create your first script" />
                    </ListItem>
                  ) : (
                    scripts.map((script) => (
                      <ListItem 
                        key={script.id} 
                        button 
                        onClick={() => handleScriptSelect(script)}
                        sx={{ 
                          bgcolor: currentScript.scriptName === script.scriptName ? 'action.selected' : 'inherit',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemText 
                          primary={script.scriptName} 
                          secondary={new Date(script.updatedAt).toLocaleDateString()}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Script Editor */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Script Name"
                  value={currentScript.scriptName}
                  onChange={handleScriptNameChange}
                  variant="outlined"
                  size="small"
                  sx={{ width: '40%' }}
                />
                <Box>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<TestIcon />}
                    onClick={handleTestScript}
                    sx={{ mr: 1 }}
                  >
                    Test
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveScript}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Script'}
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Script Content (JSON Format)
                </Typography>
                <TextField
                  fullWidth
                  value={currentScript.scriptContent}
                  onChange={handleScriptContentChange}
                  multiline
                  rows={20}
                  variant="outlined"
                  sx={{ fontFamily: 'monospace' }}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fields Reference
                </Typography>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Script Structure Guide</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" component="div">
                      <ul>
                        <li><strong>greeting</strong>: Initial message when call is answered</li>
                        <li><strong>farewell</strong>: Final message before ending the call</li>
                        <li><strong>appointment_confirmation</strong>: Template for confirming appointments (use {'{date}'} and {'{time}'} placeholders)</li>
                        <li><strong>appointment_request</strong>: Message when customer wants to schedule an appointment</li>
                        <li><strong>fallback_responses</strong>: Array of responses when AI doesn't understand input</li>
                        <li><strong>entities_to_collect</strong>: Information the AI should gather from callers</li>
                      </ul>
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Script</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body1">
              {testResponse}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScriptEditor;