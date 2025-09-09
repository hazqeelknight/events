import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryClient';
import { toast } from 'react-toastify';
import type { CalculatedSlotsParams } from '@/availability/types';
import type {
  EventType,
  EventTypeFormData,
  Booking,
  BookingCreateData,
  BookingAnalytics,
  BookingAuditLog,
  PublicOrganizer,
  PublicEventType,
  AvailableSlot,
  BookingManagement,
  BookingAction,
  AttendeeFormData,
} from '../types';

// Event Types Hooks
export const useEventTypes = () => {
  return useQuery({
    queryKey: queryKeys.events.eventTypes(),
    queryFn: async () => {
      const response = await api.get<{ results: EventType[] }>('/events/event-types/');
      return response.data.results;
    },
  });
};

export const useEventType = (id: string) => {
  return useQuery({
    queryKey: queryKeys.events.eventType(id),
    queryFn: async () => {
      const response = await api.get<EventType>(`/events/event-types/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateEventType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: EventTypeFormData) => {
      const response = await api.post<EventType>('/events/event-types/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.eventTypes() });
      toast.success('Event type created successfully');
    },
  });
};

export const useUpdateEventType = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EventTypeFormData>) => {
      const response = await api.patch<EventType>(`/events/event-types/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.eventTypes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.eventType(id) });
      toast.success('Event type updated successfully');
    },
  });
};

export const useDeleteEventType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/event-types/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.eventTypes() });
      toast.success('Event type deleted successfully');
    },
  });
};

// Bookings Hooks
export const useBookings = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.events.bookings(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const response = await api.get<{ results: Booking[] }>(`/events/bookings/?${params}`);
      return response.data.results;
    },
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: queryKeys.events.booking(id),
    queryFn: async () => {
      const response = await api.get<Booking>(`/events/bookings/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUpdateBooking = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Booking>) => {
      const response = await api.patch<Booking>(`/events/bookings/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.bookings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.booking(id) });
      toast.success('Booking updated successfully');
    },
  });
};

export const useCreateBooking = () => {
  return useMutation({
    mutationFn: async (data: BookingCreateData) => {
      const response = await api.post<Booking>('/events/bookings/create/', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking created successfully');
    },
  });
};

export const useAddAttendee = (bookingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AttendeeFormData) => {
      const response = await api.post(`/events/bookings/${bookingId}/attendees/add/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.booking(bookingId) });
      toast.success('Attendee added successfully');
    },
  });
};

export const useRemoveAttendee = (bookingId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attendeeId, reason }: { attendeeId: string; reason?: string }) => {
      await api.post(`/events/bookings/${bookingId}/attendees/${attendeeId}/remove/`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.booking(bookingId) });
      toast.success('Attendee removed successfully');
    },
  });
};

// Public Booking Hooks
export const usePublicOrganizer = (organizerSlug: string) => {
  return useQuery({
    queryKey: queryKeys.events.publicOrganizer(organizerSlug),
    queryFn: async () => {
      const response = await api.get<PublicOrganizer>(`/events/public/${organizerSlug}/`);
      return response.data;
    },
    enabled: !!organizerSlug,
  });
};

export const usePublicEventType = (organizerSlug: string, eventSlug: string, params?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.events.publicEventType(organizerSlug, eventSlug),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value.toString());
        });
      }
      const response = await api.get<PublicEventType>(
        `/events/public/${organizerSlug}/${eventSlug}/?${searchParams}`
      );
      return response.data;
    },
    enabled: !!organizerSlug && !!eventSlug,
  });
};

export const useAvailableSlots = (
  organizerSlug: string,
  eventSlug: string,
  params: Record<string, any>
) => {
  return useQuery({
    queryKey: queryKeys.events.availableSlots(organizerSlug, eventSlug, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await api.get<{ slots: AvailableSlot[] }>(
        `/events/slots/${organizerSlug}/${eventSlug}/?${searchParams}`
      );
      return response.data;
    },
    enabled: !!organizerSlug && !!eventSlug && !!params.start_date && !!params.end_date,
  });
};

// Re-export availability hook for backward compatibility
export const useCalculatedSlots = (organizerSlug: string, params: CalculatedSlotsParams) => {
  return useQuery({
    queryKey: ['calculated-slots', organizerSlug, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
      const response = await api.get(`/availability/calculated-slots/${organizerSlug}/?${searchParams}`);
      return response.data;
    },
    enabled: !!organizerSlug && !!params.event_type_slug && !!params.start_date && !!params.end_date,
  });
};

export const useBookingManagement = (accessToken: string) => {
  return useQuery({
    queryKey: ['booking-management', accessToken],
    queryFn: async () => {
      const response = await api.get<BookingManagement>(`/events/booking/${accessToken}/manage/`);
      return response.data;
    },
    enabled: !!accessToken,
  });
};

export const useBookingAction = (accessToken: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: BookingAction) => {
      const response = await api.post(`/events/booking/${accessToken}/manage/`, action);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booking-management', accessToken] });
      
      if (variables.action === 'cancel') {
        toast.success('Booking cancelled successfully');
      } else if (variables.action === 'reschedule') {
        toast.success('Booking rescheduled successfully');
      } else if (variables.action === 'regenerate_token') {
        toast.success('Access token regenerated successfully');
      }
    },
  });
};

// Analytics Hooks
export const useBookingAnalytics = (days = 30) => {
  return useQuery({
    queryKey: queryKeys.events.analytics(),
    queryFn: async () => {
      const response = await api.get<BookingAnalytics>(`/events/analytics/?days=${days}`);
      return response.data;
    },
  });
};

export const useBookingAuditLogs = (bookingId: string) => {
  return useQuery({
    queryKey: ['booking-audit-logs', bookingId],
    queryFn: async () => {
      const response = await api.get<{
        booking_id: string;
        audit_logs: BookingAuditLog[];
        total_logs: number;
      }>(`/events/bookings/${bookingId}/audit/`);
      return response.data;
    },
    enabled: !!bookingId,
  });
};

// Utility Hooks
export const useWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await api.get<{ results: any[] }>('/workflows/');
      return response.data.results;
    },
  });
};