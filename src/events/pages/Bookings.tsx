import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Button,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Search,
  Event,
  Schedule,
  Person,
  Email,
  Phone,
  VideoCall,
  LocationOn,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PageHeader, LoadingSpinner } from '@/components/core';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { useBookings } from '../hooks';
import type { Booking } from '../types';

interface BookingCardProps {
  booking: Booking;
  onViewDetails: (id: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onViewDetails }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => onViewDetails(booking.id)}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {booking.event_type.name}
            </Typography>
            <Chip
              label={booking.status_display}
              color={getStatusColor(booking.status) as any}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Schedule sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {formatDateTime(booking.start_time)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({formatDuration(booking.duration_minutes)})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {booking.invitee_name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {booking.invitee_email}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getLocationIcon(booking.event_type.location_type)}
            <Typography variant="body2" sx={{ ml: 1 }}>
              {booking.event_type.location_type === 'video_call' && 'Video Call'}
              {booking.event_type.location_type === 'phone_call' && 'Phone Call'}
              {booking.event_type.location_type === 'in_person' && 'In Person'}
              {booking.event_type.location_type === 'custom' && 'Custom Location'}
            </Typography>
          </Box>

          {booking.event_type.is_group_event && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {booking.attendee_count} of {booking.event_type.max_attendees} attendees
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                src={booking.organizer.profile.profile_picture}
                sx={{ width: 24, height: 24, mr: 1 }}
              >
                {booking.organizer.profile.display_name.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {booking.organizer.profile.display_name}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(booking.id);
              }}
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Hooks
  const { data: bookings, isLoading, error } = useBookings(filters);

  // Filter and paginate bookings
  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = !filters.search || 
      booking.invitee_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.invitee_email.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.event_type.name.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleViewDetails = (bookingId: string) => {
    navigate(`/events/bookings/${bookingId}`);
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load bookings. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Bookings"
        subtitle="View and manage all your scheduled meetings"
      />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="no_show">No Show</MenuItem>
                  <MenuItem value="rescheduled">Rescheduled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && <LoadingSpinner message="Loading bookings..." />}

      {/* Bookings Grid */}
      {!isLoading && (
        <>
          {paginatedBookings.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {paginatedBookings.map((booking) => (
                  <Grid item xs={12} sm={6} md={4} key={booking.id}>
                    <BookingCard
                      booking={booking}
                      onViewDetails={handleViewDetails}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {Object.values(filters).some(Boolean) ? 'No bookings found' : 'No bookings yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.values(filters).some(Boolean)
                  ? 'Try adjusting your filters'
                  : 'Bookings will appear here once people start scheduling meetings with you'
                }
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Bookings;