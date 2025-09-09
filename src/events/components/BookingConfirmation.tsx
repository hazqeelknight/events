import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  Link,
} from '@mui/material';
import {
  CheckCircle,
  CalendarToday,
  Schedule,
  Person,
  Email,
  VideoCall,
  Phone,
  LocationOn,
  Launch,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import type { Booking, AvailableSlot } from '../types';

interface BookingConfirmationProps {
  booking: Booking;
  selectedSlot: AvailableSlot;
  eventTypeName: string;
  organizerName: string;
  onNewBooking?: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  selectedSlot,
  eventTypeName,
  organizerName,
  onNewBooking,
}) => {
  const managementUrl = `/booking/${booking.id}/manage/`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ textAlign: 'center', p: 4 }}>
        <CardContent>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
          
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            You're all set!
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Your meeting has been successfully scheduled
          </Typography>

          {/* Meeting Details */}
          <Card variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1 }} />
                Meeting Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {eventTypeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    with {organizerName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body1">
                      {formatDateTime(selectedSlot.start_time)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                    Duration: {formatDuration(selectedSlot.duration_minutes)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body1">{booking.invitee_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.invitee_email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Meeting Access */}
          {booking.meeting_link && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Meeting Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VideoCall sx={{ mr: 1 }} />
                <Link href={booking.meeting_link} target="_blank" rel="noopener">
                  Join Video Call
                </Link>
                <Launch sx={{ ml: 0.5, fontSize: 16 }} />
              </Box>
              {booking.meeting_id && (
                <Typography variant="body2">
                  Meeting ID: {booking.meeting_id}
                </Typography>
              )}
              {booking.meeting_password && (
                <Typography variant="body2">
                  Password: {booking.meeting_password}
                </Typography>
              )}
            </Alert>
          )}

          {/* Action Buttons */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                href={managementUrl}
                target="_blank"
                rel="noopener"
              >
                Manage Booking
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={onNewBooking}
              >
                Schedule Another Meeting
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary">
            A confirmation email has been sent to {booking.invitee_email}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};