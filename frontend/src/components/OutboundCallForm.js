// OutboundCallForm.js
import React, { useState } from 'react';
import { 
  Button, TextField, Paper, Typography, Box, 
  CircularProgress, Snackbar, Alert 
} from '@mui/material';

function OutboundCallForm({ userId }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          toNumber: phoneNumber,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAlert({
          open: true,
          message: 'Call initiated successfully!',
          severity: 'success'
        });
        setPhoneNumber('');
      } else {
        setAlert({
          open: true,
          message: data.error || 'Failed to initiate call',
          severity: 'error'
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message: 'Error connecting to server',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto', my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Make Outbound Call
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          required
          margin="normal"
        />
        
        <Box sx={{ mt: 2 }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Call Now'}
          </Button>
        </Box>
      </form>
      
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={() => setAlert({...alert, open: false})}
      >
        <Alert severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default OutboundCallForm;