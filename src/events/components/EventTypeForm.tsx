import React, { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Typography,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  DragHandle,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner, Button as CustomButton } from '@/components/core';
import { useCreateEventType, useUpdateEventType, useEventType, useWorkflows } from '../hooks';
import type { EventTypeFormData } from '../types';

interface EventTypeFormProps {
  mode: 'create' | 'edit';
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];

const LOCATION_TYPES = [
  { value: 'video_call', label: 'Video Call' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'in_person', label: 'In Person' },
  { value: 'custom', label: 'Custom' },
];

const RECURRENCE_TYPES = [
  { value: 'none', label: 'No Recurrence' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multiple Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'url', label: 'URL' },
];

export const EventTypeForm: React.FC<EventTypeFormProps> = ({ mode }) => {
  const { id: eventTypeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeAccordion, setActiveAccordion] = useState<string>('basic');

  // Hooks
  const { data: eventType, isLoading: isLoadingEventType } = useEventType(eventTypeId || '');
  const { data: workflows } = useWorkflows();
  const createEventType = useCreateEventType();
  const updateEventType = useUpdateEventType(eventTypeId || '');

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<EventTypeFormData>({
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      max_attendees: 1,
      enable_waitlist: false,
      is_active: true,
      is_private: false,
      min_scheduling_notice: 60,
      max_scheduling_horizon: 43200,
      buffer_time_before: 0,
      buffer_time_after: 0,
      max_bookings_per_day: undefined,
      slot_interval_minutes: 0,
      recurrence_type: 'none',
      recurrence_rule: '',
      max_occurrences: undefined,
      recurrence_end_date: undefined,
      location_type: 'video_call',
      location_details: '',
      redirect_url_after_booking: '',
      confirmation_workflow: undefined,
      reminder_workflow: undefined,
      cancellation_workflow: undefined,
      questions_data: [],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions_data',
  });

  const watchedValues = watch();

  // Load existing data for edit mode
  React.useEffect(() => {
    if (mode === 'edit' && eventType) {
      setValue('name', eventType.name);
      setValue('description', eventType.description);
      setValue('duration', eventType.duration);
      setValue('max_attendees', eventType.max_attendees);
      setValue('enable_waitlist', eventType.enable_waitlist);
      setValue('is_active', eventType.is_active);
      setValue('is_private', eventType.is_private);
      setValue('min_scheduling_notice', eventType.min_scheduling_notice);
      setValue('max_scheduling_horizon', eventType.max_scheduling_horizon);
      setValue('buffer_time_before', eventType.buffer_time_before);
      setValue('buffer_time_after', eventType.buffer_time_after);
      setValue('max_bookings_per_day', eventType.max_bookings_per_day ?? undefined);
      setValue('slot_interval_minutes', eventType.slot_interval_minutes);
      setValue('recurrence_type', eventType.recurrence_type);
      setValue('recurrence_rule', eventType.recurrence_rule);
      setValue('max_occurrences', eventType.max_occurrences ?? undefined);
      setValue('recurrence_end_date', eventType.recurrence_end_date);
      setValue('location_type', eventType.location_type);
      setValue('location_details', eventType.location_details);
      setValue('redirect_url_after_booking', eventType.redirect_url_after_booking);
      setValue('confirmation_workflow', eventType.confirmation_workflow || '');
      setValue('reminder_workflow', eventType.reminder_workflow || '');
      setValue('cancellation_workflow', eventType.cancellation_workflow || '');
      setValue('questions_data', eventType.questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        order: q.order,
        options: q.options,
        conditions: q.conditions,
        validation_rules: q.validation_rules,
      })));
    }
  }, [eventType, mode, setValue]);

  const onSubmit = async (data: EventTypeFormData) => {
    try {
      if (mode === 'create') {
        await createEventType.mutateAsync(data);
      } else {
        await updateEventType.mutateAsync(data);
      }
      navigate('/events/types');
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const addCustomQuestion = () => {
    appendQuestion({
      question_text: '',
      question_type: 'text',
      is_required: false,
      order: questionFields.length,
      options: [],
      conditions: [],
      validation_rules: {},
    });
  };

  if (mode === 'edit' && isLoadingEventType) {
    return <LoadingSpinner message="Loading event type..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            {mode === 'create' ? 'Create Event Type' : 'Edit Event Type'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/events/types')}
            >
              Cancel
            </Button>
            <CustomButton
              type="submit"
              variant="contained"
              startIcon={<Save />}
              loading={isSubmitting}
              loadingText="Saving..."
            >
              {mode === 'create' ? 'Create Event Type' : 'Update Event Type'}
            </CustomButton>
          </Box>
        </Box>

        {/* Basic Information */}
        <Accordion
          expanded={activeAccordion === 'basic'}
          onChange={() => setActiveAccordion(activeAccordion === 'basic' ? '' : 'basic')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Basic Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Event name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Event Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="duration"
                  control={control}
                  rules={{ required: 'Duration is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.duration}>
                      <InputLabel>Duration</InputLabel>
                      <Select {...field} label="Duration">
                        {DURATION_OPTIONS.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      placeholder="Describe what this meeting is about..."
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="max_attendees"
                  control={control}
                  rules={{ 
                    required: 'Max attendees is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    max: { value: 100, message: 'Cannot exceed 100' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Max Attendees"
                      error={!!errors.max_attendees}
                      helperText={errors.max_attendees?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Controller
                    name="enable_waitlist"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Enable Waitlist"
                      />
                    )}
                  />
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Active"
                      />
                    )}
                  />
                  <Controller
                    name="is_private"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Private Event"
                      />
                    )}
                  />
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Scheduling Settings */}
        <Accordion
          expanded={activeAccordion === 'scheduling'}
          onChange={() => setActiveAccordion(activeAccordion === 'scheduling' ? '' : 'scheduling')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Scheduling Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="min_scheduling_notice"
                  control={control}
                  rules={{ min: { value: 0, message: 'Cannot be negative' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Minimum Notice (minutes)"
                      error={!!errors.min_scheduling_notice}
                      helperText={errors.min_scheduling_notice?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="max_scheduling_horizon"
                  control={control}
                  rules={{ min: { value: 60, message: 'Must be at least 60 minutes' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Maximum Advance (minutes)"
                      error={!!errors.max_scheduling_horizon}
                      helperText={errors.max_scheduling_horizon?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="buffer_time_before"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Cannot be negative' },
                    max: { value: 120, message: 'Cannot exceed 120 minutes' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Buffer Before (minutes)"
                      error={!!errors.buffer_time_before}
                      helperText={errors.buffer_time_before?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="buffer_time_after"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Cannot be negative' },
                    max: { value: 120, message: 'Cannot exceed 120 minutes' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Buffer After (minutes)"
                      error={!!errors.buffer_time_after}
                      helperText={errors.buffer_time_after?.message}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="slot_interval_minutes"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Cannot be negative' },
                    max: { value: 60, message: 'Cannot exceed 60 minutes' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Slot Interval (minutes)"
                      error={!!errors.slot_interval_minutes}
                      helperText={errors.slot_interval_minutes?.message || "0 uses organizer's default"}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="max_bookings_per_day"
                  control={control}
                  rules={{ 
                    min: { value: 1, message: 'Must be at least 1' },
                    max: { value: 50, message: 'Cannot exceed 50' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Max Bookings Per Day (optional)"
                      error={!!errors.max_bookings_per_day}
                      helperText={errors.max_bookings_per_day?.message}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Location Settings */}
        <Accordion
          expanded={activeAccordion === 'location'}
          onChange={() => setActiveAccordion(activeAccordion === 'location' ? '' : 'location')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Location & Meeting</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Location Type</InputLabel>
                      <Select {...field} label="Location Type">
                        {LOCATION_TYPES.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location_details"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location Details"
                      placeholder={
                        watchedValues.location_type === 'in_person' 
                          ? 'Enter address...'
                          : watchedValues.location_type === 'phone_call'
                          ? 'Enter phone number...'
                          : 'Enter custom instructions...'
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="redirect_url_after_booking"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Redirect URL After Booking (optional)"
                      placeholder="https://example.com/thank-you"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Recurrence Settings */}
        <Accordion
          expanded={activeAccordion === 'recurrence'}
          onChange={() => setActiveAccordion(activeAccordion === 'recurrence' ? '' : 'recurrence')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Recurrence Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="recurrence_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Recurrence Type</InputLabel>
                      <Select {...field} label="Recurrence Type">
                        {RECURRENCE_TYPES.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              {watchedValues.recurrence_type !== 'none' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="max_occurrences"
                      control={control}
                      rules={{ 
                        min: { value: 1, message: 'Must be at least 1' },
                        max: { value: 365, message: 'Cannot exceed 365' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Max Occurrences (optional)"
                          error={!!errors.max_occurrences}
                          helperText={errors.max_occurrences?.message}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="recurrence_end_date"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="date"
                          label="End Date (optional)"
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="recurrence_rule"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="RRULE String (optional)"
                          placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
                          helperText="Advanced: Enter RRULE string for complex patterns"
                        />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Workflow Integration */}
        <Accordion
          expanded={activeAccordion === 'workflows'}
          onChange={() => setActiveAccordion(activeAccordion === 'workflows' ? '' : 'workflows')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Workflow Integration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="confirmation_workflow"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Confirmation Workflow</InputLabel>
                      <Select {...field} label="Confirmation Workflow" value={field.value || ''}>
                        <MenuItem value="">None</MenuItem>
                        {workflows?.map((workflow: any) => (
                          <MenuItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="reminder_workflow"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Reminder Workflow</InputLabel>
                      <Select {...field} label="Reminder Workflow" value={field.value || ''}>
                        <MenuItem value="">None</MenuItem>
                        {workflows?.map((workflow: any) => (
                          <MenuItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="cancellation_workflow"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Cancellation Workflow</InputLabel>
                      <Select {...field} label="Cancellation Workflow" value={field.value || ''}>
                        <MenuItem value="">None</MenuItem>
                        {workflows?.map((workflow: any) => (
                          <MenuItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Custom Questions */}
        <Accordion
          expanded={activeAccordion === 'questions'}
          onChange={() => setActiveAccordion(activeAccordion === 'questions' ? '' : 'questions')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              Custom Questions
              {questionFields.length > 0 && (
                <Chip 
                  label={questionFields.length} 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addCustomQuestion}
              >
                Add Question
              </Button>
            </Box>
            
            {questionFields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <IconButton size="small" sx={{ cursor: 'grab' }}>
                    <DragHandle />
                  </IconButton>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1, ml: 1 }}>
                    Question {index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeQuestion(index)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Controller
                      name={`questions_data.${index}.question_text`}
                      control={control}
                      rules={{ required: 'Question text is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Question Text"
                          error={!!errors.questions_data?.[index]?.question_text}
                          helperText={errors.questions_data?.[index]?.question_text?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name={`questions_data.${index}.question_type`}
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Type</InputLabel>
                          <Select {...field} label="Type">
                            {QUESTION_TYPES.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name={`questions_data.${index}.is_required`}
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Switch {...field} checked={field.value} />}
                          label="Required"
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* Options for select/radio questions */}
                  {['select', 'multiselect', 'radio'].includes(watchedValues.questions_data?.[index]?.question_type) && (
                    <Grid item xs={12}>
                      <Controller
                        name={`questions_data.${index}.options`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Options (one per line)"
                            multiline
                            rows={3}
                            value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                            onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>
              </Card>
            ))}
            
            {questionFields.length === 0 && (
              <Alert severity="info">
                No custom questions added. Click "Add Question" to create questions for your invitees.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </motion.div>
  );
};