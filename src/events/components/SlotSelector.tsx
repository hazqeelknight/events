import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/core';
import { formatDuration } from '@/utils/formatters';
import { groupSlotsByDate } from '../utils';
import type { AvailableSlot } from '../types';

interface SlotSelectorProps {
  organizerSlug: string;
  eventTypeSlug: string;
  duration: number;
  attendeeCount: number;
  timezone: string;
  onSlotSelect: (slot: AvailableSlot) => void;
  selectedSlot?: AvailableSlot | null;
  isLoading?: boolean;
  slots?: AvailableSlot[];
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  organizerSlug,
  eventTypeSlug,
  duration,
  attendeeCount,
  timezone,
  onSlotSelect,
  selectedSlot,
  isLoading = false,
  slots = [],
  onDateRangeChange,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Get Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    return monday;
  });

  // Calculate week range
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);

  // Group slots by date
  const slotsByDate = groupSlotsByDate(slots);

  // Generate week dates
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    weekDates.push(date);
  }

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    
    if (onDateRangeChange) {
      const newEnd = new Date(newStart);
      newEnd.setDate(newStart.getDate() + 6);
      onDateRangeChange(
        newStart.toISOString().split('T')[0],
        newEnd.toISOString().split('T')[0]
      );
    }
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    
    if (onDateRangeChange) {
      const newEnd = new Date(newStart);
      newEnd.setDate(newStart.getDate() + 6);
      onDateRangeChange(
        newStart.toISOString().split('T')[0],
        newEnd.toISOString().split('T')[0]
      );
    }
  };

  const formatSlotTime = (startTime: string) => {
    return new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isSlotSelected = (slot: AvailableSlot) => {
    return selectedSlot?.start_time === slot.start_time;
  };

  return (
    <Box>
      {/* Week Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ChevronLeft />}
          onClick={handlePreviousWeek}
          variant="outlined"
          size="small"
        >
          Previous Week
        </Button>
        
        <Typography variant="h6">
          {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        
        <Button
          endIcon={<ChevronRight />}
          onClick={handleNextWeek}
          variant="outlined"
          size="small"
        >
          Next Week
        </Button>
      </Box>

      {/* Attendee Count Selector for Group Events */}
      {attendeeCount > 1 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Showing availability for {attendeeCount} attendees
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LoadingSpinner message="Loading available times..." />
        </Box>
      )}

      {/* Slots Grid */}
      {!isLoading && (
        <Grid container spacing={2}>
          {weekDates.map((date) => {
            const dateKey = date.toISOString().split('T')[0];
            const daySlots = slotsByDate[dateKey] || [];
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = date < new Date() && !isToday;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dateKey}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      opacity: isPast ? 0.6 : 1,
                      border: isToday ? 2 : 1,
                      borderColor: isToday ? 'primary.main' : 'divider',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Typography>
                        <Typography variant="h6" color={isToday ? 'primary.main' : 'text.primary'}>
                          {date.getDate()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </Typography>
                      </Box>

                      {daySlots.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {daySlots.slice(0, 6).map((slot, slotIndex) => (
                            <Button
                              key={slotIndex}
                              variant={isSlotSelected(slot) ? 'contained' : 'outlined'}
                              size="small"
                              onClick={() => onSlotSelect(slot)}
                              disabled={isPast}
                              sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                              }}
                            >
                              <AccessTime sx={{ mr: 0.5, fontSize: 14 }} />
                              {formatSlotTime(slot.start_time)}
                            </Button>
                          ))}
                          {daySlots.length > 6 && (
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                              +{daySlots.length - 6} more
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                          {isPast ? 'Past date' : 'No times available'}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* No Slots Available */}
      {!isLoading && Object.keys(slotsByDate).length === 0 && (
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          No available time slots found for the selected week. Try selecting a different week or contact the organizer directly.
        </Alert>
      )}

      {/* Selected Slot Summary */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ mt: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Selected Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {formatDateTime(selectedSlot.start_time)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  ({formatDuration(selectedSlot.duration_minutes)})
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  );
};