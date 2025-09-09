import React from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Typography,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  DragHandle,
  Delete,
  Add,
  ExpandMore,
} from '@mui/icons-material';
import { useFieldArray, Control, useWatch } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import type { EventTypeFormData } from '../types';

interface CustomQuestionBuilderProps {
  control: Control<EventTypeFormData>;
  errors: any;
}

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

export const CustomQuestionBuilder: React.FC<CustomQuestionBuilderProps> = ({ control, errors }) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions_data',
  });

  const watchedQuestions = useWatch({
    control,
    name: 'questions_data',
  });

  const addQuestion = () => {
    append({
      question_text: '',
      question_type: 'text',
      is_required: false,
      order: fields.length,
      options: [],
      conditions: [],
      validation_rules: {},
    });
  };

  const requiresOptions = (questionType: string) => {
    return ['select', 'multiselect', 'radio'].includes(questionType);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Custom Questions</Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={addQuestion}
        >
          Add Question
        </Button>
      </Box>

      <AnimatePresence>
        {fields.map((field, index) => {
          const questionType = watchedQuestions?.[index]?.question_type || 'text';
          
          return (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton size="small" sx={{ cursor: 'grab', mr: 1 }}>
                      <DragHandle />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Question {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Question Text"
                        {...control.register(`questions_data.${index}.question_text`, {
                          required: 'Question text is required',
                        })}
                        error={!!errors.questions_data?.[index]?.question_text}
                        helperText={errors.questions_data?.[index]?.question_text?.message}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                          {...control.register(`questions_data.${index}.question_type`)}
                          label="Question Type"
                          defaultValue="text"
                        >
                          {QUESTION_TYPES.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            {...control.register(`questions_data.${index}.is_required`)}
                          />
                        }
                        label="Required"
                      />
                    </Grid>

                    {/* Options for select/radio questions */}
                    {requiresOptions(questionType) && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Options (one per line)"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          {...control.register(`questions_data.${index}.options`)}
                          onChange={(e) => {
                            const options = e.target.value.split('\n').filter(Boolean);
                            control.setValue(`questions_data.${index}.options`, options);
                          }}
                        />
                      </Grid>
                    )}

                    {/* Validation Rules */}
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2">Advanced Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            {questionType === 'text' || questionType === 'textarea' ? (
                              <>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Min Length"
                                    {...control.register(`questions_data.${index}.validation_rules.min_length`)}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Max Length"
                                    {...control.register(`questions_data.${index}.validation_rules.max_length`)}
                                  />
                                </Grid>
                              </>
                            ) : null}
                            
                            {questionType === 'number' ? (
                              <>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Minimum Value"
                                    {...control.register(`questions_data.${index}.validation_rules.min_value`)}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Maximum Value"
                                    {...control.register(`questions_data.${index}.validation_rules.max_value`)}
                                  />
                                </Grid>
                              </>
                            ) : null}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {fields.length === 0 && (
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          No custom questions added. Click "Add Question" to create questions for your invitees.
        </Alert>
      )}
    </Box>
  );
};