import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import { Person, Email, Phone, Language } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { validateCustomAnswer } from '../utils';
import type { BookingCreateData, CustomQuestion, AvailableSlot } from '../types';

interface BookingFormProps {
  eventType: {
    name: string;
    duration: number;
    max_attendees: number;
    is_group_event: boolean;
    questions: CustomQuestion[];
  };
  selectedSlot: AvailableSlot;
  onSubmit: (data: BookingCreateData) => void;
  isSubmitting: boolean;
  organizerSlug: string;
  eventTypeSlug: string;
}

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

export const BookingForm: React.FC<BookingFormProps> = ({
  eventType,
  selectedSlot,
  onSubmit,
  isSubmitting,
  organizerSlug,
  eventTypeSlug,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
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

  const { fields: attendeeFields, append: appendAttendee, remove: removeAttendee } = useFieldArray({
    control,
    name: 'attendees_data',
  });

  const watchedValues = watch();
  const attendeeCount = watch('attendee_count');

  // Update attendees array when count changes
  React.useEffect(() => {
    const currentAttendeesCount = attendeeFields.length;
    const requiredAdditionalAttendees = Math.max(0, attendeeCount - 1); // -1 for primary invitee

    if (requiredAdditionalAttendees > currentAttendeesCount) {
      // Add more attendees
      for (let i = currentAttendeesCount; i < requiredAdditionalAttendees; i++) {
        appendAttendee({
          name: '',
          email: '',
          phone: '',
          custom_answers: {},
        });
      }
    } else if (requiredAdditionalAttendees < currentAttendeesCount) {
      // Remove excess attendees
      for (let i = currentAttendeesCount - 1; i >= requiredAdditionalAttendees; i--) {
        removeAttendee(i);
      }
    }
  }, [attendeeCount, attendeeFields.length, appendAttendee, removeAttendee]);

  const handleFormSubmit = (data: BookingFormData) => {
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

    onSubmit(bookingData);
  };

  const renderCustomQuestion = (question: CustomQuestion, index: number) => {
    const fieldName = `custom_answers.${question.question_text}`;

    switch (question.question_type) {
      case 'textarea':
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{
              required: question.is_required ? 'This field is required' : false,
              validate: (value) => {
                const validation = validateCustomAnswer(value, question);
                return validation.isValid || validation.error;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label={question.question_text}
                required={question.is_required}
                error={!!errors.custom_answers?.[question.question_text]}
                helperText={errors.custom_answers?.[question.question_text]?.message}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{ required: question.is_required ? 'This field is required' : false }}
            render={({ field }) => (
              <FormControl fullWidth required={question.is_required}>
                <InputLabel>{question.question_text}</InputLabel>
                <Select
                  {...field}
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
            )}
          />
        );

      case 'multiselect':
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{ required: question.is_required ? 'This field is required' : false }}
            render={({ field }) => (
              <FormControl fullWidth required={question.is_required}>
                <InputLabel>{question.question_text}</InputLabel>
                <Select
                  {...field}
                  multiple
                  label={question.question_text}
                  error={!!errors.custom_answers?.[question.question_text]}
                  value={field.value || []}
                >
                  {question.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{ required: question.is_required ? 'This field is required' : false }}
            render={({ field }) => (
              <FormControl component="fieldset" required={question.is_required}>
                <Typography variant="subtitle2" gutterBottom>
                  {question.question_text}
                  {question.is_required && <span style={{ color: 'red' }}> *</span>}
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
                {errors.custom_answers?.[question.question_text] && (
                  <Typography variant="caption" color="error">
                    {errors.custom_answers[question.question_text]?.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{ required: question.is_required ? 'This field is required' : false }}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value || false}
                  />
                }
                label={
                  <span>
                    {question.question_text}
                    {question.is_required && <span style={{ color: 'red' }}> *</span>}
                  </span>
                }
                required={question.is_required}
              />
            )}
          />
        );

      default:
        return (
          <Controller
            key={question.id}
            name={fieldName}
            control={control}
            rules={{
              required: question.is_required ? 'This field is required' : false,
              validate: (value) => {
                const validation = validateCustomAnswer(value, question);
                return validation.isValid || validation.error;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={question.question_text}
                type={
                  question.question_type === 'email' ? 'email' :
                  question.question_type === 'number' ? 'number' :
                  question.question_type === 'date' ? 'date' :
                  question.question_type === 'time' ? 'time' :
                  question.question_type === 'url' ? 'url' : 'text'
                }
                required={question.is_required}
                error={!!errors.custom_answers?.[question.question_text]}
                helperText={errors.custom_answers?.[question.question_text]?.message}
                InputLabelProps={
                  ['date', 'time'].includes(question.question_type)
                    ? { shrink: true }
                    : undefined
                }
              />
            )}
          />
        );
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Primary Invitee Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            Your Information
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
                    fullWidth
                    label="Full Name"
                    error={!!errors.invitee_name}
                    helperText={errors.invitee_name?.message}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
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
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="email"
                    label="Email Address"
                    error={!!errors.invitee_email}
                    helperText={errors.invitee_email?.message}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
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
                    fullWidth
                    label="Phone Number (optional)"
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
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
                    fullWidth
                    label="Timezone"
                    disabled
                    helperText="Detected automatically"
                    InputProps={{
                      startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Group Event Settings */}
      {eventType.is_group_event && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Group Event Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="attendee_count"
                  control={control}
                  rules={{
                    required: 'Attendee count is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    max: { value: eventType.max_attendees, message: `Cannot exceed ${eventType.max_attendees}` },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Number of Attendees"
                      error={!!errors.attendee_count}
                      helperText={errors.attendee_count?.message || `Maximum ${eventType.max_attendees} attendees`}
                      inputProps={{ min: 1, max: eventType.max_attendees }}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Additional Attendees */}
            {attendeeFields.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Additional Attendees
                </Typography>
                
                {attendeeFields.map((field, index) => (
                  <Card key={field.id} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Attendee {index + 2}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`attendees_data.${index}.name`}
                            control={control}
                            rules={{ required: 'Name is required' }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Full Name"
                                error={!!errors.attendees_data?.[index]?.name}
                                helperText={errors.attendees_data?.[index]?.name?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`attendees_data.${index}.email`}
                            control={control}
                            rules={{
                              required: 'Email is required',
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Invalid email address',
                              },
                            }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="email"
                                label="Email Address"
                                error={!!errors.attendees_data?.[index]?.email}
                                helperText={errors.attendees_data?.[index]?.email?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`attendees_data.${index}.phone`}
                            control={control}
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
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Questions */}
      {eventType.questions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
            
            <Grid container spacing={3}>
              {eventType.questions.map((question, index) => (
                <Grid item xs={12} key={question.id}>
                  {renderCustomQuestion(question, index)}
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};