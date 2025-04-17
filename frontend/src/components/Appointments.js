import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format } from 'date-fns';
import { getAppointments, createAppointment, deleteAppointment } from '../services/api';

const Appointments = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [appointments, setAppointments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    appointmentDate: null,
    appointmentTime: null,
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, [userId]);

  const fetchAppointments = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getAppointments(userId);
      setAppointments(data);
    } catch (err) {
      setError('Failed to load appointments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      appointmentDate: date
    });
  };

  const handleTimeChange = (time) => {
    setFormData({
      ...formData,
      appointmentTime: time
    });
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({
      customerName: '',
      customerPhone: '',
      appointmentDate: null,
      appointmentTime: null,
      notes: ''
    });
  };

  const handleSaveAppointment = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.appointmentDate || !formData.appointmentTime) {
      setError('All fields except notes are required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await createAppointment({
        userId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        appointmentDate: format(formData.appointmentDate, 'yyyy-MM-dd'),
        appointmentTime: format(formData.appointmentTime, 'HH:mm'),
        notes: formData.notes
      });
      
      setSuccess('Appointment created successfully!');
      fetchAppointments(); // Refresh the list
      handleDialogClose();
    } catch (err) {
      setError('Failed to create appointment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await deleteAppointment(id);
      setSuccess('Appointment deleted successfully!');
      fetchAppointments(); // Refresh the list
    } catch (err) {
      setError('Failed to delete appointment: ' + err.message);
    }
  };

  const filteredAppointments = filterDate
    ? appointments.filter(app => app.appointmentDate === format(filterDate, 'yyyy-MM-dd'))
    : appointments;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Appointment Management
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DatePicker
              label="Filter by Date"
              value={filterDate}
              onChange={(date) => setFilterDate(date)}
              renderInput={(params) => <TextField {...params} size="small" sx={{ width: 200 }} />}
            />
            <Button 
              startIcon={<FilterIcon />} 
              onClick={() => setFilterDate(null)} 
              sx={{ ml: 1 }}
              disabled={!filterDate}
            >
              Clear Filter
            </Button>
          </Box>
          
          <Box>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={fetchAppointments} 
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleDialogOpen}
            >
              New Appointment
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : appointments.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No appointments found. Create your first appointment or receive calls to schedule them.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.customerName}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {appointment.customerPhone}
                          </Box>
                        </TableCell>
                        <TableCell>{appointment.appointmentDate}</TableCell>
                        <TableCell>{appointment.appointmentTime}</TableCell>
                        <TableCell>{appointment.notes}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleDeleteAppointment(appointment.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        
        {/* New Appointment Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Appointment Date"
                  value={formData.appointmentDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="Appointment Time"
                  value={formData.appointmentTime}
                  onChange={handleTimeChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              onClick={handleSaveAppointment} 
              variant="contained" 
              color="primary"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Appointment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;