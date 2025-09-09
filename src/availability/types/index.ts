// Availability Module TypeScript Types

export interface AvailabilityRule {
  id: string;
  organizer: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  timezone_name: string;
  created_at: string;
  updated_at: string;
}

export interface DateOverride {
  id: string;
  organizer: string;
  date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedTime {
  id: string;
  organizer: string;
  start_time: string;
  end_time: string;
  reason: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringBlockedTime {
  id: string;
  organizer: string;
  name: string;
  recurrence_rule: string;
  duration_minutes: number;
  start_date: string;
  end_date?: string;
  timezone_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BufferSettings {
  id: string;
  organizer: string;
  default_buffer_before: number;
  default_buffer_after: number;
  minimum_gap_between_meetings: number;
  timezone_name: string;
  created_at: string;
  updated_at: string;
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

export interface CalculatedSlotsParams {
  event_type_slug: string;
  start_date: string;
  end_date: string;
  invitee_timezone?: string;
  attendee_count?: number;
  invitee_timezones?: string[];
}

export interface CalculatedSlotsResponse {
  organizer_slug: string;
  event_type_slug: string;
  start_date: string;
  end_date: string;
  invitee_timezone: string;
  attendee_count: number;
  available_slots: AvailableSlot[];
  cache_hit: boolean;
  total_slots: number;
  computation_time_ms: number;
  invitee_timezones?: string[];
  multi_invitee_mode?: boolean;
  warnings?: string[];
  performance_metrics?: {
    duration: number;
    total_slots_calculated: number;
    date_range_days: number;
  };
}

export interface AvailabilityStats {
  total_rules: number;
  active_rules: number;
  total_overrides: number;
  active_overrides: number;
  total_blocked_times: number;
  active_blocked_times: number;
  cache_hit_rate: number;
  average_computation_time: number;
}

// Form Data Types
export interface AvailabilityRuleFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  timezone_name: string;
}

export interface DateOverrideFormData {
  date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  reason: string;
}

export interface BlockedTimeFormData {
  start_time: string;
  end_time: string;
  reason: string;
  is_recurring: boolean;
  recurrence_rule?: string;
}

export interface RecurringBlockedTimeFormData {
  name: string;
  recurrence_rule: string;
  duration_minutes: number;
  start_date: string;
  end_date?: string;
  timezone_name: string;
  is_active: boolean;
}

export interface BufferSettingsFormData {
  default_buffer_before: number;
  default_buffer_after: number;
  minimum_gap_between_meetings: number;
  timezone_name: string;
}