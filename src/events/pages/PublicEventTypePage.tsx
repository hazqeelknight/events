import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Schedule,
  People,
  LocationOn,
  ArrowBack,
  ArrowForward,
  CalendarToday,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { LoadingSpinner, Button as CustomButton } from '@/components/core';
import { formatDuration, formatDateTime } from '@/utils/formatters';
import { useCreateBooking, useCalculatedSlots } from '../hooks';
import { api } from '@/api/client';
import type { BookingCreateData, AvailableSlot } from '../types';
import type { CalculatedSlotsParams } from '@/availability/types';

const steps = ['Select Time', 'Enter Details', 'Confirm'];

interface BookingFormData {
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  attendee_count: number;
  custom_answers: Record<string, any>;
  attendees_data: Array<{
    name: string;
    email: string;
    phone: string;
    custom_answers: Record<string, any>;
  }>;
}

interface PublicEventTypeData {
  name: string;
  event_type_slug: string;
  description: string;
  duration: number;
  max_attendees: number;
  enable_waitlist: boolean;
  location_type: string;
  location_details: string;
  min_scheduling_notice: number;
  max_scheduling_horizon: number;
  organizer_name: string;
  organizer_bio: string;
  organizer_picture?: string;
  organizer_company: string;
  organizer_timezone: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_type: string;
    is_required: boolean;
    options: string[];
  }>;
  is_group_event: boolean;
}

const PublicEventTypePage: React.FC = () => {
  const { organizerSlug, eventTypeSlug } = useParams<{ organizerSlug: string; eventTypeSlug: string }>();
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [eventType, setEventType] = useState<PublicEventTypeData | null>(null);
  const [isLoadingEventType, setIsLoadingEventType] = useState(true);
  const [eventTypeError, setEventTypeError] = useState<any>(null);

  // Get current date for initial availability check
  const [selectedDate] = useState(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return {
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
    };
  });

  // Load event type data
  useEffect(() => {
    const loadEventType = async () => {
      if (!organizerSlug || !eventTypeSlug) return;
      
      try {
        setIsLoadingEventType(true);
        const response = await api.get(`/events/public/${organizerSlug}/${eventTypeSlug}/`);
        setEventType(response.data);
        setEventTypeError(null);
      } catch (error) {
        setEventTypeError(error);
        setEventType(null);
      } finally {
        setIsLoadingEventType(false);
      }
    };
    
    loadEventType();
  }, [organizerSlug, eventTypeSlug]);

  // Prepare parameters for availability calculation
  const slotsParams: CalculatedSlotsParams = useMemo(() => ({
    event_type_slug: eventTypeSlug || '',
    start_date: selectedDate.start_date,
    end_date: selectedDate.end_date,
    invitee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    attendee_count: attendeeCount,
  }), [eventTypeSlug, selectedDate.start_date, selectedDate.end_date, attendeeCount]);

  // Use availability module's calculated slots hook
  const { data: slotsData, isLoading: isLoadingSlots } = useCalculatedSlots(
    organizerSlug || '',
    slotsParams
  );

  const createBooking = useCreateBooking();

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<BookingFormData>({
    defaultValues: {
      invitee_name: '',
      invitee_email: '',
      invitee_phone: '',
      invitee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attendee_count: 1,
      custom_answers: {},
      attendees_data: [],
    },
  });

  const watchedValues = watch();

  // Update attendee count when it changes
  useEffect(() => {
    setAttendeeCount(watchedValues.attendee_count);
  }, [watchedValues.attendee_count]);

  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    if (!slotsData?.available_slots) return {};
    
    return slotsData.available_slots.reduce((acc: Record<string, AvailableSlot[]>, slot: AvailableSlot) => {
      const date = new Date(slot.local_start_time || slot.start_time).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(slot);
      return acc;
    }, {});
  }, [slotsData]);

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 1 && isValid) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlot || !organizerSlug || !eventTypeSlug) return;

    const bookingData: BookingCreateData = {
      organizer_slug: organizerSlug,
      event_type_slug: eventTypeSlug,
      invitee_name: data.invitee_name,
      invitee_email: data.invitee_email,
      invitee_phone: data.invitee_phone,
      invitee_timezone: data.invitee_timezone,
      attendee_count: data.attendee_count,
      start_time: selectedSlot.start_time,
      custom_answers: data.custom_answers,
      attendees_data: data.attendees_data,
    };

    try {
      const result = await createBooking.mutateAsync(bookingData);
      setBookingResult(result);
      setBookingSuccess(true);
    } catch (error: any) {
      // Handle waitlist case
      if (error?.response?.status === 409 && eventType?.enable_waitlist) {
        // Show waitlist option
        console.log('Slot unavailable, showing waitlist option');
      }
    }
  };

  if (isLoadingEventType) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (eventTypeError || !eventType) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          Event type not found or is not available for booking.
        </Alert>
      </Container>
    );
  }

  if (bookingSuccess && bookingResult) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your meeting has been successfully scheduled.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {eventType.name}
              </Typography>
              <Typography variant="body2">
                {formatDateTime(selectedSlot?.local_start_time || selectedSlot?.start_time || '')}
              </Typography>
              <Typography variant="body2">
                Duration: {formatDuration(eventType.duration)}
              </Typography>
            </Box>

            {bookingResult.meeting_link && (
              <Button
                variant="contained"
                href={bookingResult.meeting_link}
                target="_blank"
                sx={{ mb: 2, mr: 2 }}
              >
                Join Meeting
              </Button>
            )}
            
            <Button
              variant="outlined"
              href={`/booking/${bookingResult.access_token}/manage/`}
              target="_blank"
            >
              Manage Booking
            </Button>
          </Card>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/${organizerSlug}`)}
            sx={{ mb: 2 }}
          >
            Back to {eventType.organizer_name}
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={eventType.organizer_picture}
              sx={{ width: 48, height: 48, mr: 2 }}
            >
              {eventType.organizer_name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                {eventType.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                with {eventType.organizer_name}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip icon={<Schedule />} label={formatDuration(eventType.duration)} />
            <Chip icon={<People />} label={eventType.is_group_event ? `Up to ${eventType.max_attendees} people` : '1-on-1'} />
            <Chip icon={<LocationOn />} label={
              eventType.location_type === 'video_call' ? 'Video call' :
              eventType.location_type === 'phone_call' ? 'Phone call' :
              eventType.location_type === 'in_person' ? 'In person' : 'Custom'
            } />
          </Box>
          
          {eventType.description && (
            <Typography variant="body2" color="text.secondary">
              {eventType.description}
            </Typography>
          )}
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          {/* Step Content */}
          <Grid item xs={12} md={8}>
            <AnimatePresence mode="wait">
              {/* Step 1: Select Time */}
              {activeStep === 0 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Select a time
                      </Typography>
                      
                      {eventType.is_group_event && (
                        <Box sx={{ mb: 3 }}>
                          <TextField
                            type="number"
                            label="Number of attendees"
                            value={attendeeCount}
                            onChange={(e) => setAttendeeCount(Math.max(1, Math.min(eventType.max_attendees, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: eventType.max_attendees }}
                            sx={{ width: 200 }}
                          />
                        </Box>
                      )}
                      
                      {isLoadingSlots ? (
                        <LoadingSpinner message="Loading available times..." />
                      ) : Object.keys(slotsByDate).length > 0 ? (
                        <Box>
                          {/* Cache performance info */}
                          {slotsData && 'cache_hit' in slotsData && slotsData.cache_hit && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              Loaded from cache ({slotsData.computation_time_ms || 0}ms)
                            </Alert>
                          )}
                          
                          {/* Warnings */}
                          {slotsData && 'warnings' in slotsData && slotsData.warnings && slotsData.warnings.length > 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              {slotsData.warnings.join(', ')}
                            </Alert>
                          )}
                          
                          {Object.entries(slotsByDate).map(([date, slots]) => (
                            <Box key={date} sx={{ mb: 3 }}>
                              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarToday sx={{ mr: 1, fontSize: 18 }} />
                                {new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                              <Grid container spacing={1}>
                                {(slots as AvailableSlot[]).map((slot: AvailableSlot, index: number) => (
                                  <Grid item key={index}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleSlotSelect(slot)}
                                      startIcon={<AccessTime />}
                                    >
                                      {new Date(slot.local_start_time || slot.start_time).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </Button>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          ))}
                          
                          {/* Slot count info */}
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            {(slotsData && 'total_slots' in slotsData ? slotsData.total_slots : 0)} available time{((slotsData && 'total_slots' in slotsData ? slotsData.total_slots : 0) !== 1) ? 's' : ''} found
                          </Typography>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          No available times in the selected date range. Try selecting different dates.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Enter Details */}
              {activeStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Enter your details
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name="invitee_name"
                            control={control}
                            rules={{ required: 'Name is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value || ''}
                                fullWidth
                                label="Full Name"
                                error={!!errors.invitee_name}
                                helperText={errors.invitee_name?.message?.toString()}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name="invitee_email"
                            control={control}
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
                                value={field.value || ''}
                                fullWidth
                                type="email"
                                label="Email Address"
                                error={!!errors.invitee_email}
                                helperText={errors.invitee_email?.message?.toString()}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name="invitee_phone"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value || ''}
                                fullWidth
                                label="Phone Number (optional)"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Controller
                            name="invitee_timezone"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value || ''}
                                fullWidth
                                label="Timezone"
                                disabled
                                helperText="Detected automatically"
                              />
                            )}
                          />
                        </Grid>
                        
                        {eventType.is_group_event && (
                          <Grid item xs={12}>
                            <Controller
                              name="attendee_count"
                              control={control}
                              rules={{ 
                                required: 'Attendee count is required',
                                min: { value: 1, message: 'Must be at least 1' },
                                max: { value: eventType.max_attendees, message: `Cannot exceed ${eventType.max_attendees}` }
                              }}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value || 1}
                                  fullWidth
                                  type="number"
                                  label="Number of Attendees"
                                  error={!!errors.attendee_count}
                                  helperText={errors.attendee_count?.message?.toString()}
                                  inputProps={{ min: 1, max: eventType.max_attendees }}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              )}
                            />
                          </Grid>
                        )}
                        
                        {/* Custom Questions */}
                        {eventType.questions.map((question, _index) => (
                          <Grid item xs={12} key={question.id}>
                            <Controller
                              name={`custom_answers.${question.question_text}`}
                              control={control}
                              rules={{ required: question.is_required ? 'This field is required' : false }}
                              render={({ field }) => {
                                switch (question.question_type) {
                                  case 'textarea':
                                    return (
                                      <TextField
                                        {...field}
                                        value={field.value || ''}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label={question.question_text}
                                        required={question.is_required}
                                        error={!!errors.custom_answers?.[question.question_text]}
                                        helperText={errors.custom_answers?.[question.question_text]?.message?.toString()}
                                      />
                                    );
                                  case 'select':
                                    return (
                                      <FormControl fullWidth required={question.is_required}>
                                        <InputLabel>{question.question_text}</InputLabel>
                                        <Select
                                          {...field}
                                          value={field.value || ''}
                                          label={question.question_text}
                                          error={!!errors.custom_answers?.[question.question_text]}
                                        >
                                          {question.options.map((option) => (
                                            <MenuItem key={option} value={option}>
                                              {option}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  case 'radio':
                                    return (
                                      <FormControl component="fieldset" required={question.is_required}>
                                        <Typography variant="subtitle2" gutterBottom>
                                          {question.question_text}
                                        </Typography>
                                        <RadioGroup {...field}>
                                          {question.options.map((option) => (
                                            <FormControlLabel
                                              key={option}
                                              value={option}
                                              control={<Radio />}
                                              label={option}
                                            />
                                          ))}
                                        </RadioGroup>
                                      </FormControl>
                                    );
                                  case 'checkbox':
                                    return (
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            {...field}
                                            checked={field.value || false}
                                          />
                                        }
                                        label={question.question_text}
                                        required={question.is_required}
                                      />
                                    );
                                  default:
                                    return (
                                      <TextField
                                        {...field}
                                        value={field.value || ''}
                                        fullWidth
                                        label={question.question_text}
                                        type={question.question_type === 'email' ? 'email' : 
                                              question.question_type === 'number' ? 'number' :
                                              question.question_type === 'date' ? 'date' :
                                              question.question_type === 'time' ? 'time' :
                                              question.question_type === 'url' ? 'url' : 'text'}
                                        required={question.is_required}
                                        error={!!errors.custom_answers?.[question.question_text]}
                                        helperText={errors.custom_answers?.[question.question_text]?.message?.toString()}
                                        InputLabelProps={
                                          ['date', 'time'].includes(question.question_type) 
                                            ? { shrink: true } 
                                            : undefined
                                        }
                                      />
                                    );
                                }
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Confirm */}
              {activeStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Confirm your booking
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Meeting Details
                        </Typography>
                        <Typography variant="body2">
                          <strong>{eventType.name}</strong>
                        </Typography>
                        <Typography variant="body2">
                          {selectedSlot && formatDateTime(selectedSlot.local_start_time || selectedSlot.start_time)}
                        </Typography>
                        <Typography variant="body2">
                          Duration: {formatDuration(eventType.duration)}
                        </Typography>
                        <Typography variant="body2">
                          Location: {eventType.location_type === 'video_call' ? 'Video call' :
                                   eventType.location_type === 'phone_call' ? 'Phone call' :
                                   eventType.location_type === 'in_person' ? 'In person' : 'Custom'}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Your Information
                        </Typography>
                        <Typography variant="body2">
                          <strong>Name:</strong> {watchedValues.invitee_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {watchedValues.invitee_email}
                        </Typography>
                        {watchedValues.invitee_phone && (
                          <Typography variant="body2">
                            <strong>Phone:</strong> {watchedValues.invitee_phone}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Timezone:</strong> {watchedValues.invitee_timezone}
                        </Typography>
                      </Box>
                      
                      {Object.keys(watchedValues.custom_answers).length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Additional Information
                            </Typography>
                            {Object.entries(watchedValues.custom_answers).map(([question, answer]) => (
                              <Typography variant="body2" key={question} sx={{ mb: 1 }}>
                                <strong>{question}:</strong> {Array.isArray(answer) ? answer.join(', ') : answer}
                              </Typography>
                            ))}
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={eventType.organizer_picture}
                  sx={{ width: 40, height: 40, mr: 2 }}
                >
                  {eventType.organizer_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {eventType.organizer_name}
                  </Typography>
                  {eventType.organizer_company && (
                    <Typography variant="caption" color="text.secondary">
                      {eventType.organizer_company}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {eventType.name}
              </Typography>
              
              {selectedSlot && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                    {formatDateTime(selectedSlot.local_start_time || selectedSlot.start_time)}
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, fontSize: 16 }} />
                    {formatDuration(eventType.duration)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3 }}>
                {activeStep > 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ mb: 1 }}
                  >
                    Back
                  </Button>
                )}
                
                {activeStep === 1 && (
                  <CustomButton
                    fullWidth
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isValid}
                    endIcon={<ArrowForward />}
                  >
                    Continue
                  </CustomButton>
                )}
                
                {activeStep === 2 && (
                  <CustomButton
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    loading={createBooking.isPending}
                    loadingText="Booking..."
                  >
                    Confirm Booking
                  </CustomButton>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default PublicEventTypePage;