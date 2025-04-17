import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { uploadKnowledgeBase, getKnowledgeBases } from '../services/api';

const KnowledgeBase = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [kbName, setKbName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [userId]);

  const fetchKnowledgeBases = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getKnowledgeBases(userId);
      setKnowledgeBases(data);
    } catch (err) {
      setError('Failed to load knowledge bases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!kbName) {
      setError('Knowledge base name is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('kbName', kbName);

    try {
      await uploadKnowledgeBase(formData);
      setSuccess('Knowledge base uploaded successfully!');
      setKbName(''); // Reset the form
      e.target.value = null; // Reset the file input
      fetchKnowledgeBases(); // Refresh the list
    } catch (err) {
      setError('Failed to upload knowledge base: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileIcon style={{ color: '#f44336' }} />;
      case 'doc':
      case 'docx':
        return <FileIcon style={{ color: '#2196f3' }} />;
      case 'txt':
        return <FileIcon style={{ color: '#4caf50' }} />;
      case 'csv':
        return <FileIcon style={{ color: '#ff9800' }} />;
      case 'json':
        return <FileIcon style={{ color: '#9c27b0' }} />;
      default:
        return <FileIcon />;
    }
  };

  const getFileTypeLabel = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return extension.toUpperCase();
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Knowledge Base Management
      </Typography>
      
      <Grid container spacing={3}>
        {/* Upload Form */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Knowledge Base
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Knowledge Base Name"
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  required
                  placeholder="e.g., Product Documentation"
                />
              </Box>
              
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.csv,.json"
              />
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={handleFileSelect}
                disabled={uploading || !kbName}
                sx={{ mt: 2 }}
              >
                {uploading ? <CircularProgress size={24} /> : 'Upload File'}
              </Button>
              
              <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                Supported formats: PDF, DOC, DOCX, TXT, CSV, JSON
              </Typography>
              
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
        
        {/* Knowledge Base List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Your Knowledge Bases
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchKnowledgeBases}
                  disabled={loading}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
              
              <Divider />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : knowledgeBases.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No knowledge bases found. Upload your first file to get started.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {knowledgeBases.map((kb) => (
                    <ListItem key={kb.id}>
                      <ListItemIcon>
                        {getFileTypeIcon(kb.originalFilename)}
                      </ListItemIcon>
                      <ListItemText
                        primary={kb.kbName}
                        secondary={
                          <>
                            {kb.originalFilename} • {new Date(kb.createdAt).toLocaleDateString()}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          size="small" 
                          label={getFileTypeLabel(kb.originalFilename)} 
                          color="primary" 
                          variant="outlined" 
                          sx={{ mr: 1 }}
                        />
                        <IconButton edge="end" aria-label="delete">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KnowledgeBase;