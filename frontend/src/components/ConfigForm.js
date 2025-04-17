import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getUserConfig, saveUserConfig } from '../services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `config-tab-${index}`,
    'aria-controls': `config-tabpanel-${index}`,
  };
}

const ConfigForm = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');

  // Twilio config
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');

  // LLM config
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('gpt-3.5-turbo');

  // Deepgram config
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [deepgramModel, setDeepgramModel] = useState('nova');
  const [deepgramVoice, setDeepgramVoice] = useState('aura');
  const [deepgramLanguage, setDeepgramLanguage] = useState('en-US');

  useEffect(() => {
    const fetchConfig = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const config = await getUserConfig(userId);
        
        // Set Twilio config
        if (config.twilioConfig) {
          setTwilioAccountSid(config.twilioConfig.accountSid || '');
          setTwilioAuthToken(config.twilioConfig.authToken || '');
          setTwilioPhoneNumber(config.twilioConfig.phoneNumber || '');
        }
        
        // Set LLM config
        if (config.llmConfig) {
          setLlmProvider(config.llmConfig.provider || 'openai');
          setLlmApiKey(config.llmConfig.apiKey || '');
          setLlmModel(config.llmConfig.model || 'gpt-3.5-turbo');
        }
        
        // Set Deepgram config
        if (config.deepgramConfig) {
          setDeepgramApiKey(config.deepgramConfig.apiKey || '');
          setDeepgramModel(config.deepgramConfig.model || 'nova');
          setDeepgramVoice(config.deepgramConfig.voice || 'aura');
          setDeepgramLanguage(config.deepgramConfig.language || 'en-US');
        }
        
      } catch (err) {
        setError('Failed to load configuration: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [userId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSave = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Build config object
      const configData = {
        userId,
        twilioConfig: {
          accountSid: twilioAccountSid,
          authToken: twilioAuthToken,
          phoneNumber: twilioPhoneNumber
        },
        llmConfig: {
          provider: llmProvider,
          apiKey: llmApiKey,
          model: llmModel
        },
        deepgramConfig: {
          apiKey: deepgramApiKey,
          model: deepgramModel,
          voice: deepgramVoice,
          language: deepgramLanguage
        }
      };

      // Save to API
      await saveUserConfig(configData);
      setSuccess('Configuration saved successfully!');
      
      // Save user ID to localStorage
      localStorage.setItem('user_id', userId);
      
    } catch (err) {
      setError('Failed to save configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Platform Configuration
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              helperText="Unique identifier for your account"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="config tabs">
              <Tab label="Twilio" {...a11yProps(0)} />
              <Tab label="LLM" {...a11yProps(1)} />
              <Tab label="Deepgram" {...a11yProps(2)} />
            </Tabs>
          </Box>

          {/* Twilio Config */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Configure your Twilio integration for handling phone calls
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account SID"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Auth Token"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  type="password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="+1234567890"
                  helperText="Must include country code (e.g., +1 for US)"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* LLM Config */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Configure your LLM provider for AI conversations
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="llm-provider-label">Provider</InputLabel>
                  <Select
                    labelId="llm-provider-label"
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    label="Provider"
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="google">Google AI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  type="password"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="llm-model-label">Model</InputLabel>
                  <Select
                    labelId="llm-model-label"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    label="Model"
                  >
                    {llmProvider === 'openai' && (
                      <>
                        <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                        <MenuItem value="gpt-4">GPT-4</MenuItem>
                        <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                      </>
                    )}
                    {llmProvider === 'anthropic' && (
                      <>
                        <MenuItem value="claude-3-opus">Claude 3 Opus</MenuItem>
                        <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
                        <MenuItem value="claude-3-haiku">Claude 3 Haiku</MenuItem>
                      </>
                    )}
                    {llmProvider === 'google' && (
                      <>
                        <MenuItem value="gemini-pro">Gemini Pro</MenuItem>
                        <MenuItem value="gemini-ultra">Gemini Ultra</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Deepgram Config */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Configure Deepgram for speech-to-text and text-to-speech
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={deepgramApiKey}
                  onChange={(e) => setDeepgramApiKey(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  type="password"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="deepgram-model-label">STT Model</InputLabel>
                  <Select
                    labelId="deepgram-model-label"
                    value={deepgramModel}
                    onChange={(e) => setDeepgramModel(e.target.value)}
                    label="STT Model"
                  >
                    <MenuItem value="nova">Nova</MenuItem>
                    <MenuItem value="enhanced">Enhanced</MenuItem>
                    <MenuItem value="base">Base</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="deepgram-voice-label">TTS Voice</InputLabel>
                  <Select
                    labelId="deepgram-voice-label"
                    value={deepgramVoice}
                    onChange={(e) => setDeepgramVoice(e.target.value)}
                    label="TTS Voice"
                  >
                    <MenuItem value="aura">Aura</MenuItem>
                    <MenuItem value="stella">Stella</MenuItem>
                    <MenuItem value="nova">Nova</MenuItem>
                    <MenuItem value="aurora">Aurora</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="deepgram-language-label">Language</InputLabel>
                  <Select
                    labelId="deepgram-language-label"
                    value={deepgramLanguage}
                    onChange={(e) => setDeepgramLanguage(e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="en-US">English (US)</MenuItem>
                    <MenuItem value="en-GB">English (UK)</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="it">Italian</MenuItem>
                    <MenuItem value="ja">Japanese</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
              sx={{ ml: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
            </Button>
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
    </Box>
  );
};

export default ConfigForm;