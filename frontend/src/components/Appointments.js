import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  PlusCircle, 
  Trash2, 
  Phone, 
  RefreshCw, 
  FilterX, 
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { getAppointments, createAppointment, deleteAppointment } from '../services/api';

const Appointments = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId] = useState(() => localStorage.getItem('user_id') || '');
  const [appointments, setAppointments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    appointmentDate: null,
    appointmentTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getAppointments(userId);
      setAppointments(data);
      setError(null);
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

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        customerName: '',
        customerPhone: '',
        appointmentDate: null,
        appointmentTime: '',
        notes: ''
      });
    }
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
        appointmentTime: formData.appointmentTime,
        notes: formData.notes
      });
      
      setSuccess('Appointment created successfully!');
      fetchAppointments(); // Refresh the list
      handleDialogOpenChange(false);
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointment Management</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAppointments}
          disabled={loading}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Appointment Form */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
              
              <div className="mb-4">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full mt-1"
                />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className="w-full mt-1"
                />
              </div>
              
              <div className="mb-4">
                <Label>Appointment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !formData.appointmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formData.appointmentDate ? (
                        format(formData.appointmentDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.appointmentDate}
                      onSelect={(date) => setFormData({
                        ...formData,
                        appointmentDate: date
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="appointmentTime">Appointment Time</Label>
                <Input
                  id="appointmentTime"
                  name="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className="w-full mt-1"
                />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about the appointment"
                  rows={3}
                  className="w-full mt-1"
                />
              </div>
              
              <Button
                className="w-full mt-2 bg-gray-600 hover:bg-gray-700"
                variant="default"
                onClick={handleSaveAppointment}
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Schedule Appointment
                  </div>
                )}
              </Button>
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Appointments List */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">All Appointments</h3>
                
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filterDate ? (
                          format(filterDate, "PPP")
                        ) : (
                          <span>Filter by date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {filterDate && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilterDate(null)}
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">
                    No appointments found. Create your first appointment or receive calls to schedule them.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            {appointment.customerPhone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            {appointment.appointmentDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            {appointment.appointmentTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.notes ? (
                            appointment.notes
                          ) : (
                            <span className="text-muted-foreground text-sm italic">No notes</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Appointments;