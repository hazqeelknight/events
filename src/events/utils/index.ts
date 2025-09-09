// Events module utilities

/**
 * Format event type location for display
 */
export const formatEventLocation = (locationType: string, locationDetails?: string): string => {
  const locationMap = {
    video_call: 'Video Call',
    phone_call: 'Phone Call',
    in_person: 'In Person',
    custom: 'Custom Location',
  };
  
  const baseLocation = locationMap[locationType as keyof typeof locationMap] || 'Unknown';
  return locationDetails ? `${baseLocation} - ${locationDetails}` : baseLocation;
};

/**
 * Get status color for booking status
 */
export const getBookingStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
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
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Calculate booking end time from start time and duration
 */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return end.toISOString();
};

/**
 * Validate booking time constraints
 */
export const validateBookingTime = (
  startTime: string,
  eventType: {
    min_scheduling_notice: number;
    max_scheduling_horizon: number;
  }
): { isValid: boolean; error?: string } => {
  const now = new Date();
  const bookingTime = new Date(startTime);
  
  // Check minimum notice
  const minNoticeTime = new Date(now.getTime() + eventType.min_scheduling_notice * 60000);
  if (bookingTime < minNoticeTime) {
    return {
      isValid: false,
      error: `Booking must be at least ${eventType.min_scheduling_notice} minutes in advance`,
    };
  }
  
  // Check maximum horizon
  const maxHorizonTime = new Date(now.getTime() + eventType.max_scheduling_horizon * 60000);
  if (bookingTime > maxHorizonTime) {
    return {
      isValid: false,
      error: `Booking cannot be more than ${Math.floor(eventType.max_scheduling_horizon / (24 * 60))} days in advance`,
    };
  }
  
  return { isValid: true };
};

/**
 * Format recurrence rule for display
 */
export const formatRecurrenceRule = (recurrenceType: string, recurrenceRule?: string): string => {
  if (recurrenceType === 'none') return 'No recurrence';
  
  const typeMap = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };
  
  const baseType = typeMap[recurrenceType as keyof typeof typeMap] || recurrenceType;
  
  if (recurrenceRule) {
    // Parse RRULE for more detailed display
    try {
      const rules = recurrenceRule.split(';');
      const freq = rules.find(r => r.startsWith('FREQ='))?.split('=')[1];
      const byDay = rules.find(r => r.startsWith('BYDAY='))?.split('=')[1];
      
      if (byDay && freq === 'WEEKLY') {
        const days = byDay.split(',').map(day => {
          const dayMap: Record<string, string> = {
            MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun'
          };
          return dayMap[day] || day;
        });
        return `Weekly on ${days.join(', ')}`;
      }
    } catch (error) {
      // Fall back to basic type if parsing fails
    }
  }
  
  return baseType;
};

/**
 * Group available slots by date
 */
export const groupSlotsByDate = (slots: Array<{ start_time: string; end_time: string; duration_minutes: number; available_spots: number }>) => {
  return slots.reduce((acc, slot) => {
    const date = new Date(slot.start_time).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);
};

/**
 * Check if event type is bookable
 */
export const isEventTypeBookable = (eventType: {
  is_active: boolean;
  is_private: boolean;
  min_scheduling_notice: number;
  max_scheduling_horizon: number;
}): { bookable: boolean; reason?: string } => {
  if (!eventType.is_active) {
    return { bookable: false, reason: 'This event type is currently inactive' };
  }
  
  // Additional checks could be added here for scheduling constraints
  return { bookable: true };
};

/**
 * Format attendee count for display
 */
export const formatAttendeeCount = (count: number, maxAttendees: number): string => {
  if (maxAttendees === 1) {
    return '1-on-1 meeting';
  }
  
  if (count === maxAttendees) {
    return `${count} attendees (full)`;
  }
  
  return `${count} of ${maxAttendees} attendees`;
};

/**
 * Calculate available spots for group events
 */
export const calculateAvailableSpots = (currentAttendees: number, maxAttendees: number): number => {
  return Math.max(0, maxAttendees - currentAttendees);
};

/**
 * Validate custom question answer
 */
export const validateCustomAnswer = (
  answer: any,
  question: {
    question_type: string;
    is_required: boolean;
    validation_rules: Record<string, any>;
    options: string[];
  }
): { isValid: boolean; error?: string } => {
  // Required field check
  if (question.is_required && (!answer || (typeof answer === 'string' && !answer.trim()))) {
    return { isValid: false, error: 'This field is required' };
  }
  
  // Type-specific validation
  switch (question.question_type) {
    case 'email':
      if (answer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      break;
    case 'phone':
      if (answer && !/^\+?[\d\s\-\(\)]{10,}$/.test(answer)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      break;
    case 'url':
      if (answer) {
        try {
          new URL(answer);
        } catch {
          return { isValid: false, error: 'Please enter a valid URL' };
        }
      }
      break;
    case 'number':
      if (answer && isNaN(Number(answer))) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      break;
    case 'select':
    case 'radio':
      if (answer && !question.options.includes(answer)) {
        return { isValid: false, error: 'Please select a valid option' };
      }
      break;
    case 'multiselect':
      if (answer && Array.isArray(answer)) {
        const invalidOptions = answer.filter(opt => !question.options.includes(opt));
        if (invalidOptions.length > 0) {
          return { isValid: false, error: 'Please select valid options only' };
        }
      }
      break;
  }
  
  // Custom validation rules
  if (question.validation_rules) {
    const { min_length, max_length, pattern } = question.validation_rules;
    
    if (min_length && answer && answer.length < min_length) {
      return { isValid: false, error: `Minimum length is ${min_length} characters` };
    }
    
    if (max_length && answer && answer.length > max_length) {
      return { isValid: false, error: `Maximum length is ${max_length} characters` };
    }
    
    if (pattern && answer && !new RegExp(pattern).test(answer)) {
      return { isValid: false, error: 'Please enter a valid format' };
    }
  }
  
  return { isValid: true };
};