import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Event,
  Schedule,
  Person,
  Email,
  Phone,
  LocationOn,
  VideoCall,
  Cancel,
  Edit,
  Refresh,
  CheckCircle,
  Warning,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { LoadingSpinner, Button as CustomButton } from '@/components/core';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { useBookingManagement, useBookingAction, useAvailableSlots } from '../hooks';
import type { BookingAction } from '../types';

const BookingManagementPage: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string>('');

  // Hooks
  const { data: booking, isLoading, error } = useBookingManagement(accessToken || '');
  const bookingAction = useBookingAction(accessToken || '');

  // Get available slots for rescheduling (if booking exists)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 14);

  const { data: availableSlots } = useAvailableSlots(
    booking?.organizer_name || '',
    booking?.event_type_name || '',
    {
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      timezone: booking?.invitee_timezone || 'UTC',
      attendee_count: 1,
    }
  );

  // Cancel form
  const {
    control: cancelControl,
    handleSubmit: handleCancelSubmit,
    formState: { errors: cancelErrors },
  } = useForm({
    defaultValues: {
      reason: '',
    },
  });

  // Reschedule form
  const {
    control: rescheduleControl,
    handleSubmit: handleRescheduleSubmit,
    formState: { errors: rescheduleErrors },
  } = useForm({
    defaultValues: {
      new_start_time: '',
    },
  });

  const handleCancel = async (data: { reason: string }) => {
    try {
      await bookingAction.mutateAsync({
        action: 'cancel',
        reason: data.reason,
      });
      setCancelDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleReschedule = async () => {
    if (!selectedNewSlot) return;
    
    try {
      await bookingAction.mutateAsync({
        action: 'reschedule',
        new_start_time: selectedNewSlot,
      });
      setRescheduleDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleRegenerateToken = async () => {
    try {
      await bookingAction.mutateAsync({
        action: 'regenerate_token',
      });
      setRegenerateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

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

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case 'video_call':
        return <VideoCall />;
      case 'phone_call':
        return <Phone />;
      case 'in_person':
        return <LocationOn />;
      default:
        return <LocationOn />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading booking details..." />;
  }

  if (error || !booking) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          Booking not found or access token is invalid/expired.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            Manage Your Booking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your scheduled meeting
          </Typography>
        </Box>

        {/* Booking Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {booking.event_type_name}
              </Typography>
              <Chip
                label={booking.status_display}
                color={getStatusColor(booking.status) as any}
              />
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatDateTime(booking.start_time)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {formatDuration(booking.duration_minutes)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person sx={{ mr: 2, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body1">{booking.invitee_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.invitee_email}
                    </Typography>
                  </Box>
                </Box>

                {booking.invitee_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 2, color: 'text.secondary' }} />
                    <Typography variant="body1">{booking.invitee_phone}</Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                    {booking.organizer_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {booking.organizer_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Organizer
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Timezone: {booking.invitee_timezone}
                </Typography>
              </Grid>
            </Grid>

            {/* Meeting Information */}
            {(booking.meeting_link || booking.meeting_id) && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Meeting Information
                </Typography>
                <Grid container spacing={2}>
                  {booking.meeting_link && (
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<VideoCall />}
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noopener"
                      >
                        Join Meeting
                      </Button>
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
              </>
            )}

            {/* Custom Answers */}
            {Object.keys(booking.custom_answers).length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
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
              </>
            )}

            {/* Group Event Attendees */}
            {booking.attendees && booking.attendees.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Attendees ({booking.attendees.length})
                </Typography>
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
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {booking.status === 'confirmed' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Manage Your Booking
              </Typography>
              <Grid container spacing={2}>
                {booking.can_reschedule && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setRescheduleDialogOpen(true)}
                    >
                      Reschedule
                    </Button>
                  </Grid>
                )}
                {booking.can_cancel && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Booking
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => setRegenerateDialogOpen(true)}
                  >
                    Regenerate Link
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Booking Info */}
        {booking.status === 'cancelled' && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              This booking was cancelled
            </Typography>
            {booking.cancelled_at && (
              <Typography variant="body2">
                Cancelled on: {formatDateTime(booking.cancelled_at)}
              </Typography>
            )}
            {booking.cancellation_reason && (
              <Typography variant="body2">
                Reason: {booking.cancellation_reason}
              </Typography>
            )}
          </Alert>
        )}

        {/* Cancel Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to cancel this booking?
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <Controller
                name="reason"
                control={cancelControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason for cancellation (optional)"
                    placeholder="Let the organizer know why you're cancelling..."
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <CustomButton
              onClick={handleCancelSubmit(handleCancel)}
              color="error"
              variant="contained"
              loading={bookingAction.isPending}
            >
              Cancel Booking
            </CustomButton>
          </DialogActions>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Select a new time for your meeting:
            </Typography>
            <Box sx={{ mt: 2 }}>
              {availableSlots?.slots && availableSlots.slots.length > 0 ? (
                <FormControl fullWidth>
                  <InputLabel>Available Times</InputLabel>
                  <Select
                    value={selectedNewSlot}
                    label="Available Times"
                    onChange={(e) => setSelectedNewSlot(e.target.value)}
                  >
                    {availableSlots.slots.map((slot, index) => (
                      <MenuItem key={index} value={slot.start_time}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                          {formatDateTime(slot.start_time)}
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            ({formatDuration(slot.duration_minutes)})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Alert severity="info">
                  No available time slots found in the next 14 days. Please contact the organizer directly.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <CustomButton
              onClick={handleReschedule}
              variant="contained"
              loading={bookingAction.isPending}
              disabled={!selectedNewSlot}
            >
              Reschedule
            </CustomButton>
          </DialogActions>
        </Dialog>

        {/* Regenerate Token Dialog */}
        <Dialog open={regenerateDialogOpen} onClose={() => setRegenerateDialogOpen(false)}>
          <DialogTitle>Regenerate Access Link</DialogTitle>
          <DialogContent>
            <Typography>
              This will generate a new access link for managing your booking. 
              The current link will no longer work.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegenerateDialogOpen(false)}>
              Cancel
            </Button>
            <CustomButton
              onClick={handleRegenerateToken}
              variant="contained"
              loading={bookingAction.isPending}
            >
              Regenerate Link
            </CustomButton>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default BookingManagementPage;