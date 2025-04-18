import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  RefreshCw, 
  FilterX, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Mic,
  Play,
  Pause,
  X,
  ChevronDown,
  Phone
} from 'lucide-react';
import { getCallLogs, getCallRecordings, getCallTranscript } from '../services/api';

const CallLogs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId] = useState(() => localStorage.getItem('user_id') || '');
  const [callLogs, setCallLogs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefsMap = useRef({});

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: '',
    phoneNumber: '',
  });

  useEffect(() => {
    fetchCallLogs();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setError(null);
    } catch (err) {
      setError('Failed to load call logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallRecordings = async (call) => {
    if (!call || !call.id) return;
    
    setLoadingRecordings(true);
    try {
      const data = await getCallRecordings(userId, call.id);
      setRecordings(data);
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const fetchCallTranscript = async (call) => {
    if (!call || !call.id) return;
    
    setLoadingTranscript(true);
    try {
      const data = await getCallTranscript(call.id);
      setTranscript(data);
    } catch (err) {
      console.error('Failed to load transcript:', err);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
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
    setActiveTab("info");
    setRecordings([]);
    setTranscript(null);
    
    // Fetch recordings and transcript
    setTimeout(() => {
      fetchCallRecordings(call);
      fetchCallTranscript(call);
    }, 100);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentlyPlaying(null);
    
    // Stop all audio playback when closing dialog
    Object.values(audioRefsMap.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
      }
    });
  };

  const togglePlayPause = (recordingSid) => {
    if (currentlyPlaying === recordingSid) {
      // Currently playing this recording, pause it
      if (audioRefsMap.current[recordingSid] && !audioRefsMap.current[recordingSid].paused) {
        audioRefsMap.current[recordingSid].pause();
        setCurrentlyPlaying(null);
      } else if (audioRefsMap.current[recordingSid]) {
        // It's paused, resume it
        audioRefsMap.current[recordingSid].play();
      }
    } else {
      // Playing a different recording
      // First, pause any currently playing audio
      if (currentlyPlaying && audioRefsMap.current[currentlyPlaying] && !audioRefsMap.current[currentlyPlaying].paused) {
        audioRefsMap.current[currentlyPlaying].pause();
      }
      
      // Now play the new recording
      if (audioRefsMap.current[recordingSid]) {
        audioRefsMap.current[recordingSid].play();
        setCurrentlyPlaying(recordingSid);
      }
    }
  };

  const handleAudioEnded = (recordingSid) => {
    if (currentlyPlaying === recordingSid) {
      setCurrentlyPlaying(null);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getCallStatusBadge = (status) => {
    let variant = "outline";
    
    switch (status) {
      case 'completed':
        variant = "success";
        break;
      case 'failed':
        variant = "destructive";
        break;
      case 'busy':
      case 'no-answer':
        variant = "warning";
        break;
      default:
        variant = "secondary";
    }
    
    return (
      <Badge variant={variant}>
        {status}
      </Badge>
    );
  };

  // Calculate pagination
  const startIndex = page * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, callLogs.length);
  const paginatedCalls = callLogs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(callLogs.length / rowsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Call Logs</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCallLogs}
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Filter Calls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {filters.startDate ? (
                      format(filters.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleFilterChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {filters.endDate ? (
                      format(filters.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleFilterChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Status</Label>
              <select 
                className="w-full mt-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="busy">Busy</option>
                <option value="no-answer">No Answer</option>
              </select>
            </div>
            
            <div>
              <Label>Phone Number</Label>
              <Input
                className="mt-1"
                placeholder="e.g. +1234567890"
                value={filters.phoneNumber}
                onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                className="bg-gray-600 hover:bg-gray-700"
                variant="default"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
              >
                <FilterX className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Call Logs Table */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Call History</h3>
          
          <Separator className="my-2" />
          
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : callLogs.length === 0 ? (
            <div className="py-8 text-center">
              <Phone className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">
                No call logs found. Configure your Twilio number to start receiving calls.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        {new Date(call.startedAt || call.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ArrowUpRight className="h-4 w-4 mr-2 text-muted-foreground" />
                          {call.fromNumber || call.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ArrowDownRight className="h-4 w-4 mr-2 text-muted-foreground" />
                          {call.toNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        {getCallStatusBadge(call.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(call)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Custom Pagination */}
              <div className="flex items-center justify-between my-4">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {endIndex} of {callLogs.length} calls
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page - 1)}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangePage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Call Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedCall && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Details
              </DialogTitle>
            </DialogHeader>
            
            <DialogContent className="sm:max-w-[800px]">
              <div className="w-full mb-6">
                {/* Custom tabs implementation since ui/tabs is not available */}
                <div className="flex border-b">
                  <button 
                    className={`px-4 py-2 flex items-center gap-1 ${activeTab === "info" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    onClick={() => setActiveTab("info")}
                  >
                    <Info className="h-4 w-4" />
                    Call Info
                  </button>
                  <button 
                    className={`px-4 py-2 flex items-center gap-1 ${activeTab === "recordings" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    onClick={() => setActiveTab("recordings")}
                  >
                    <Mic className="h-4 w-4" />
                    Recordings
                  </button>
                  <button 
                    className={`px-4 py-2 flex items-center gap-1 ${activeTab === "transcript" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    onClick={() => setActiveTab("transcript")}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Transcript
                  </button>
                </div>
                
                {/* Tab 1: Call Information */}
                {activeTab === "info" && (
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Call Information</h3>
                          <div className="rounded-md border">
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">Call SID</span>
                              <span>{selectedCall.callSid || selectedCall.id}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">From</span>
                              <span>{selectedCall.fromNumber || selectedCall.phone_number}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">To</span>
                              <span>{selectedCall.toNumber || "N/A"}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">Started At</span>
                              <span>{new Date(selectedCall.startedAt || selectedCall.created_at).toLocaleString()}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">Ended At</span>
                              <span>{selectedCall.endedAt ? new Date(selectedCall.endedAt).toLocaleString() : "N/A"}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">Duration</span>
                              <span>{formatDuration(selectedCall.duration)}</span>
                            </div>
                            <div className="px-4 py-2.5 border-b flex justify-between">
                              <span className="font-medium">Status</span>
                              <span>{getCallStatusBadge(selectedCall.status)}</span>
                            </div>
                            <div className="px-4 py-2.5 flex justify-between">
                              <span className="font-medium">Notes</span>
                              <span>{selectedCall.notes || "No notes"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Conversation History</h3>
                          {selectedCall.conversationHistory && selectedCall.conversationHistory.length > 0 ? (
                            <div className="rounded-md border p-3 max-h-80 overflow-y-auto">
                              {selectedCall.conversationHistory.map((message, index) => (
                                <div 
                                  key={index} 
                                  className={cn(
                                    "mb-3 p-3 rounded-lg max-w-[80%]",
                                    message.role === 'user' 
                                      ? "bg-gray-100 mr-auto" 
                                      : "bg-blue-100 ml-auto"
                                  )}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-md border p-4 text-center text-gray-500">
                              No conversation history available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab 2: Recordings */}
                {activeTab === "recordings" && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-3">Call Recordings</h3>
                    
                    {loadingRecordings ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : recordings.length === 0 ? (
                      <Alert>
                        <AlertDescription>No recordings found for this call.</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {recordings.map((recording, index) => (
                          <div key={recording.recording_sid || index} className="border rounded-md overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                              onClick={() => document.getElementById(`recording-content-${index}`).classList.toggle('hidden')}
                            >
                              <span className="font-medium">Recording {index + 1} ({formatDuration(recording.duration || 0)})</span>
                              <ChevronDown className="h-5 w-5" />
                            </div>
                            <div id={`recording-content-${index}`} className="p-4 border-t hidden">
                              <audio 
                                src={recording.recording_url}
                                ref={(element) => {
                                  if (element) {
                                    audioRefsMap.current[recording.recording_sid] = element;
                                    element.addEventListener('ended', () => handleAudioEnded(recording.recording_sid));
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              
                              <div className="flex items-center mb-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => togglePlayPause(recording.recording_sid)}
                                >
                                  {currentlyPlaying === recording.recording_sid ? 
                                    <Pause className="h-4 w-4 mr-1" /> : 
                                    <Play className="h-4 w-4 mr-1" />
                                  }
                                  {currentlyPlaying === recording.recording_sid ? "Pause" : "Play"}
                                </Button>
                                <span className="text-sm text-gray-500">
                                  {new Date(recording.date_created).toLocaleString()}
                                </span>
                              </div>
                              
                              {recording.transcription && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-1">Transcription:</h4>
                                  <div className="p-3 rounded bg-gray-50 text-sm">
                                    {recording.transcription}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Tab 3: Transcript */}
                {activeTab === "transcript" && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-3">Call Transcript</h3>
                    
                    {loadingTranscript ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : !transcript || (!transcript.full_transcript && (!transcript.transcript_parts || transcript.transcript_parts.length === 0)) ? (
                      <Alert>
                        <AlertDescription>No transcript available for this call.</AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {transcript.full_transcript && (
                          <div className="p-4 rounded bg-gray-50 text-sm">
                            {transcript.full_transcript}
                          </div>
                        )}
                        
                        {transcript.transcript_parts && transcript.transcript_parts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Transcript Segments</h4>
                            
                            <div className="space-y-2">
                              {transcript.transcript_parts.map((part, index) => (
                                <div 
                                  key={index}
                                  className="p-3 rounded border text-sm"
                                >
                                  <p>{part.text}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(part.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
                className="mb-2"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default CallLogs;