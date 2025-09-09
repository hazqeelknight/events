// Events Module TypeScript Types
export interface EventType {
  id: string;
  organizer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    profile: {
      display_name: string;
      organizer_slug: string;
      profile_picture?: string;
      company?: string;
      timezone_name: string;
    };
  };
  name: string;
  event_type_slug: string;
  description: string;
  duration: number;
  max_attendees: number;
  enable_waitlist: boolean;
  is_active: boolean;
  is_private: boolean;
  min_scheduling_notice: number;
  max_scheduling_horizon: number;
  buffer_time_before: number;
  buffer_time_after: number;
  max_bookings_per_day?: number;
  slot_interval_minutes: number;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_rule: string;
  max_occurrences?: number;
  recurrence_end_date?: string;
  location_type: 'video_call' | 'phone_call' | 'in_person' | 'custom';
  location_details: string;
  redirect_url_after_booking: string;
  confirmation_workflow?: string;
  reminder_workflow?: string;
  cancellation_workflow?: string;
  questions: CustomQuestion[];
  is_group_event: boolean;
  total_duration_with_buffers: number;
  created_at: string;
  updated_at: string;
}

export interface CustomQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'url';
  question_type_display: string;
  is_required: boolean;
  order: number;
  options: string[];
  conditions: any[];
  validation_rules: Record<string, any>;
}

export interface Booking {
  id: string;
  event_type: EventType;
  organizer: EventType['organizer'];
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  attendee_count: number;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  status_display: string;
  recurrence_id?: string;
  is_recurring_exception: boolean;
  recurrence_sequence?: number;
  custom_answers: Record<string, any>;
  meeting_link: string;
  meeting_id: string;
  meeting_password: string;
  calendar_sync_status: 'pending' | 'succeeded' | 'failed' | 'not_required';
  attendees: Attendee[];
  duration_minutes: number;
  can_cancel: boolean;
  can_reschedule: boolean;
  is_access_token_valid: boolean;
  cancelled_at?: string;
  cancelled_by?: 'organizer' | 'invitee' | 'system';
  cancellation_reason: string;
  rescheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'cancelled' | 'no_show';
  status_display: string;
  custom_answers: Record<string, any>;
  joined_at: string;
  cancelled_at?: string;
  cancellation_reason: string;
}

export interface WaitlistEntry {
  id: string;
  event_type_name: string;
  desired_start_time: string;
  desired_end_time: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  notify_when_available: boolean;
  expires_at: string;
  status: 'active' | 'notified' | 'converted' | 'expired' | 'cancelled';
  status_display: string;
  is_expired: boolean;
  custom_answers: Record<string, any>;
  notified_at?: string;
  created_at: string;
}

export interface BookingAuditLog {
  id: string;
  action: string;
  action_display: string;
  description: string;
  actor_type: 'organizer' | 'invitee' | 'attendee' | 'system' | 'integration';
  actor_email: string;
  actor_name: string;
  ip_address?: string;
  metadata: Record<string, any>;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  created_at: string;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  local_start_time?: string;
  local_end_time?: string;
  invitee_times?: Record<string, {
    start_time: string;
    end_time: string;
    start_hour: number;
    end_hour: number;
    is_reasonable: boolean;
  }>;
  fairness_score?: number;
  available_spots?: number;
}

export interface PublicOrganizer {
  organizer_slug: string;
  display_name: string;
  bio: string;
  profile_picture?: string;
  company: string;
  website: string;
  timezone: string;
  brand_color: string;
  event_types: Array<{
    name: string;
    event_type_slug: string;
    description: string;
    duration: number;
    location_type: string;
    max_attendees: number;
    is_group_event: boolean;
  }>;
}

export interface PublicEventType {
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
  questions: CustomQuestion[];
  is_group_event: boolean;
  available_slots: AvailableSlot[];
  cache_hit: boolean;
  total_slots: number;
  performance_metrics: Record<string, any>;
  search_params: Record<string, any>;
}

export interface BookingAnalytics {
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  no_show_bookings: number;
  calendar_sync_success: number;
  calendar_sync_failed: number;
  calendar_sync_pending: number;
  bookings_by_event_type: Array<{
    event_type__name: string;
    count: number;
  }>;
  cancellations_by_actor: Array<{
    cancelled_by: string;
    count: number;
  }>;
  group_event_stats: {
    total_group_bookings: number;
    average_attendees: number;
  };
}

// Form-specific types (without read-only fields)
export interface CustomQuestionForm {
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'email' | 'phone' | 'number' | 'date' | 'time' | 'url';
  is_required: boolean;
  order: number;
  options: string[];
  conditions: any[];
  validation_rules: Record<string, any>;
}

// Form Data Types
export interface EventTypeFormData {
  name: string;
  description: string;
  duration: number;
  max_attendees: number;
  enable_waitlist: boolean;
  is_active: boolean;
  is_private: boolean;
  min_scheduling_notice: number;
  max_scheduling_horizon: number;
  buffer_time_before: number;
  buffer_time_after: number;
  max_bookings_per_day?: number;
  slot_interval_minutes: number;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_rule: string;
  max_occurrences?: number;
  recurrence_end_date?: string;
  location_type: 'video_call' | 'phone_call' | 'in_person' | 'custom';
  location_details: string;
  redirect_url_after_booking: string;
  confirmation_workflow?: string;
  reminder_workflow?: string;
  cancellation_workflow?: string;
  questions_data: CustomQuestionForm[];
}

export interface BookingCreateData {
  organizer_slug: string;
  event_type_slug: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  attendee_count: number;
  start_time: string;
  custom_answers: Record<string, any>;
  attendees_data: Array<{
    name: string;
    email: string;
    phone: string;
    custom_answers: Record<string, any>;
  }>;
}

export interface BookingManagement {
  id: string;
  event_type_name: string;
  organizer_name: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone: string;
  invitee_timezone: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  status_display: string;
  meeting_link: string;
  meeting_id: string;
  meeting_password: string;
  custom_answers: Record<string, any>;
  cancelled_at?: string;
  cancellation_reason: string;
  access_token_expires_at: string;
  can_cancel: boolean;
  can_reschedule: boolean;
  attendees?: Attendee[];
  available_spots?: number;
}

export interface BookingAction {
  action: 'cancel' | 'reschedule' | 'regenerate_token';
  reason?: string;
  new_start_time?: string;
}

export interface AttendeeFormData {
  name: string;
  email: string;
  phone: string;
  custom_answers: Record<string, any>;
}