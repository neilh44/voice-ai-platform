import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  CallMade as CallMadeIcon,
  CallReceived as CallReceivedIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { getCallLogs } from '../services/api';

const CallLogs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [callLogs, setCallLogs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchCallLogs();
  }, [userId]);

  const fetchCallLogs = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Prepare filter params
      const filterParams = {};
      if (filters.startDate) filterParams.startDate = format(filters.startDate, 'yyyy-MM-dd');
      if (filters.endDate) filterParams.endDate = format(filters.endDate, 'yyyy-MM-dd');
      if (filters.status) filterParams.status = filters.status;
      if (filters.phoneNumber) filterParams.phoneNumber = filters.phoneNumber;
      
      const data = await getCallLogs(userId, filterParams);
      setCallLogs(data);
    } catch (err) {
      setError('Failed to load call logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      status: '',
      phoneNumber: '',
    });
  };

  const handleApplyFilters = () => {
    setPage(0); // Reset to first page
    fetchCallLogs();
  };

  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'busy':
        return 'warning';
      case 'no-answer':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Empty or loading state
  if (loading && callLogs.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Call Logs
        </Typography>
        
        {/* Filter Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="busy">Busy</MenuItem>
                    <MenuItem value="no-answer">No Answer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number"
                  value={filters.phoneNumber}
                  onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApplyFilters}
                    startIcon={<FilterIcon />}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Call Logs Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchCallLogs}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {callLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          No call logs found. Configure your Twilio number to start receiving calls.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (rowsPerPage > 0
                      ? callLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      : callLogs
                    ).map((call) => (
                      <TableRow key={call.id} hover>
                        <TableCell>
                          {new Date(call.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CallMadeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {call.fromNumber}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CallReceivedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {call.toNumber}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDuration(call.duration)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={call.status} 
                            color={getCallStatusColor(call.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(call)}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={callLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
        
        {/* Call Details Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          {selectedCall && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 2 }} />
                  Call Details
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Call Information</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Call SID</TableCell>
                            <TableCell>{selectedCall.callSid}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>From</TableCell>
                            <TableCell>{selectedCall.fromNumber}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>To</TableCell>
                            <TableCell>{selectedCall.toNumber}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Started At</TableCell>
                            <TableCell>{new Date(selectedCall.startedAt).toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Ended At</TableCell>
                            <TableCell>{new Date(selectedCall.endedAt).toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                            <TableCell>{formatDuration(selectedCall.duration)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={selectedCall.status} 
                                color={getCallStatusColor(selectedCall.status)}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Conversation History</Typography>
                    {selectedCall.conversationHistory && selectedCall.conversationHistory.length > 0 ? (
                      <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                        {selectedCall.conversationHistory.map((message, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              mb: 2, 
                              p: 1.5, 
                              borderRadius: 2, 
                              backgroundColor: message.role === 'user' ? 'grey.100' : 'primary.light',
                              color: message.role === 'user' ? 'text.primary' : 'primary.contrastText',
                              maxWidth: '80%',
                              ml: message.role === 'user' ? 0 : 'auto',
                              mr: message.role === 'user' ? 'auto' : 0,
                            }}
                          >
                            <Typography variant="body2">
                              {message.content}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          No conversation history available
                        </Typography>
                      </Paper>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CallLogs;