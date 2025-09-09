import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Avatar,
  Link,
} from '@mui/material';
import {
  ExpandMore,
  Person,
  Event,
  Schedule,
  LocationOn,
  VideoCall,
  Phone,
  Email,
  Delete,
  Add,
  History,
  Cancel,
  CheckCircle,
  Warning,
  Sync,
  SyncProblem,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { LoadingSpinner, Button as CustomButton } from '@/components/core';
import { useBooking, useUpdateBooking, useAddAttendee, useRemoveAttendee, useBookingAuditLogs } from '../hooks';
import type { AttendeeFormData } from '../types';

interface BookingDetailsProps {
  bookingId: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'completed':
      return 'info';
    case 'no_show':
      return 'warning';
    case 'rescheduled':
      return 'secondary';
    default:
      return 'default';
  }
};

const getCalendarSyncIcon = (status: string) => {
  switch (status) {
    case 'succeeded':
      return <CheckCircle color="success" />;
    case 'failed':
      return <SyncProblem color="error" />;
    case 'pending':
      return <Sync color="warning" />;
    default:
      return <Warning color="disabled" />;
  }
};

export const BookingDetails: React.FC<BookingDetailsProps> = ({ bookingId }) => {
  const [addAttendeeOpen, setAddAttendeeOpen] = useState(false);
  const [removeAttendeeId, setRemoveAttendeeId] = useState<string | null>(null);
  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string>('details');

  // Hooks
  const { data: booking, isLoading } = useBooking(bookingId);
  const { data: auditLogs } = useBookingAuditLogs(bookingId);
  const updateBooking = useUpdateBooking(bookingId);
  const addAttendee = useAddAttendee(bookingId);
  const removeAttendee = useRemoveAttendee(bookingId);

  // Add attendee form
  const {
    control: attendeeControl,
    handleSubmit: handleAttendeeSubmit,
    reset: resetAttendeeForm,
    formState: { errors: attendeeErrors },
  } = useForm<AttendeeFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      custom_answers: {},
    },
  });

  // Update status form
  const {
    control: statusControl,
    handleSubmit: handleStatusSubmit,
    formState: { errors: statusErrors },
  } = useForm({
    defaultValues: {
      status: booking?.status || 'confirmed',
      cancellation_reason: '',
    },
  });

  const onAddAttendee = async (data: AttendeeFormData) => {
    try {
      await addAttendee.mutateAsync(data);
      setAddAttendeeOpen(false);
      resetAttendeeForm();
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const onRemoveAttendee = async (reason?: string) => {
    if (!removeAttendeeId) return;
    
    try {
      await removeAttendee.mutateAsync({ attendeeId: removeAttendeeId, reason });
      setRemoveAttendeeId(null);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const onUpdateStatus = async (data: any) => {
    try {
      await updateBooking.mutateAsync({
        status: data.status,
        ...(data.status === 'cancelled' && { cancellation_reason: data.cancellation_reason }),
      });
      setUpdateStatusOpen(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <Alert severity="error">
        Booking not found or you don't have permission to view it.
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Booking Details</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setUpdateStatusOpen(true)}
            disabled={booking.status === 'cancelled' || booking.status === 'completed'}
          >
            Update Status
          </Button>
          {booking.event_type.is_group_event && booking.status === 'confirmed' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddAttendeeOpen(true)}
            >
              Add Attendee
            </Button>
          )}
        </Box>
      </Box>

      {/* Booking Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Event sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h5">{booking.event_type.name}</Typography>
                <Chip
                  label={booking.status_display}
                  color={getStatusColor(booking.status) as any}
                  sx={{ ml: 2 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body1">
                  {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  ({formatDuration(booking.duration_minutes)})
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body1">
                  {booking.invitee_name} ({booking.invitee_email})
                </Typography>
              </Box>
              
              {booking.invitee_phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">{booking.invitee_phone}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="body1">
                  {booking.event_type.location_type === 'video_call' && 'Video Call'}
                  {booking.event_type.location_type === 'phone_call' && 'Phone Call'}
                  {booking.event_type.location_type === 'in_person' && 'In Person'}
                  {booking.event_type.location_type === 'custom' && 'Custom Location'}
                  {booking.event_type.location_details && ` - ${booking.event_type.location_details}`}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Organizer
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
                  <Avatar
                    src={booking.organizer.profile.profile_picture}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {booking.organizer.profile.display_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {booking.organizer.profile.display_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.organizer.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Calendar Sync
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {getCalendarSyncIcon(booking.calendar_sync_status)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {booking.calendar_sync_status}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Meeting Information */}
      {(booking.meeting_link || booking.meeting_id) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Meeting Information
            </Typography>
            <Grid container spacing={2}>
              {booking.meeting_link && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VideoCall sx={{ mr: 2, color: 'primary.main' }} />
                    <Link href={booking.meeting_link} target="_blank" rel="noopener">
                      Join Meeting
                    </Link>
                  </Box>
                </Grid>
              )}
              {booking.meeting_id && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Meeting ID: {booking.meeting_id}
                  </Typography>
                </Grid>
              )}
              {booking.meeting_password && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Password: {booking.meeting_password}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Group Event Attendees */}
      {booking.event_type.is_group_event && (
        <Accordion
          expanded={activeAccordion === 'attendees'}
          onChange={() => setActiveAccordion(activeAccordion === 'attendees' ? '' : 'attendees')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              Attendees ({booking.attendees.length}/{booking.event_type.max_attendees})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {booking.attendees.map((attendee) => (
                <ListItem key={attendee.id}>
                  <ListItemText
                    primary={attendee.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">{attendee.email}</Typography>
                        {attendee.phone && (
                          <Typography variant="body2">{attendee.phone}</Typography>
                        )}
                        <Chip
                          label={attendee.status_display}
                          size="small"
                          color={getStatusColor(attendee.status) as any}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {attendee.status === 'confirmed' && (
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => setRemoveAttendeeId(attendee.id)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            {booking.attendees.length === 0 && (
              <Alert severity="info">
                No additional attendees for this group event.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Custom Answers */}
      {Object.keys(booking.custom_answers).length > 0 && (
        <Accordion
          expanded={activeAccordion === 'answers'}
          onChange={() => setActiveAccordion(activeAccordion === 'answers' ? '' : 'answers')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Custom Answers</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(booking.custom_answers).map(([question, answer]) => (
                <Grid item xs={12} md={6} key={question}>
                  <Typography variant="subtitle2" gutterBottom>
                    {question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Array.isArray(answer) ? answer.join(', ') : answer}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Audit Trail */}
      <Accordion
        expanded={activeAccordion === 'audit'}
        onChange={() => setActiveAccordion(activeAccordion === 'audit' ? '' : 'audit')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            Audit Trail
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {auditLogs?.audit_logs.map((log) => (
            <Box key={log.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">{log.action_display}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(log.created_at)}
                </Typography>
              </Box>
              <Typography variant="body2" gutterBottom>
                {log.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                by {log.actor_name} ({log.actor_type})
              </Typography>
            </Box>
          ))}
          
          {!auditLogs?.audit_logs.length && (
            <Alert severity="info">
              No audit logs available for this booking.
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Add Attendee Dialog */}
      <Dialog open={addAttendeeOpen} onClose={() => setAddAttendeeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Attendee</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={attendeeControl}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!attendeeErrors.name}
                      helperText={attendeeErrors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={attendeeControl}
                  rules={{ 
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="email"
                      label="Email"
                      error={!!attendeeErrors.email}
                      helperText={attendeeErrors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="phone"
                  control={attendeeControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone (optional)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAttendeeOpen(false)}>Cancel</Button>
          <CustomButton
            onClick={handleAttendeeSubmit(onAddAttendee)}
            variant="contained"
            loading={addAttendee.isPending}
          >
            Add Attendee
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Remove Attendee Dialog */}
      <Dialog open={!!removeAttendeeId} onClose={() => setRemoveAttendeeId(null)}>
        <DialogTitle>Remove Attendee</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this attendee from the booking?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveAttendeeId(null)}>Cancel</Button>
          <Button
            onClick={() => onRemoveAttendee()}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusOpen} onClose={() => setUpdateStatusOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={statusControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Status"
                      SelectProps={{ native: true }}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No Show</option>
                      <option value="rescheduled">Rescheduled</option>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="cancellation_reason"
                  control={statusControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Reason (optional)"
                      placeholder="Enter reason for status change..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateStatusOpen(false)}>Cancel</Button>
          <CustomButton
            onClick={handleStatusSubmit(onUpdateStatus)}
            variant="contained"
            loading={updateBooking.isPending}
          >
            Update Status
          </CustomButton>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};