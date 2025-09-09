import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { queryKeys } from '@/api/queryClient';
import { toast } from 'react-toastify';
import type {
  AvailabilityRule,
  DateOverride,
  BlockedTime,
  RecurringBlockedTime,
  BufferSettings,
  AvailabilityStats,
  CalculatedSlotsParams,
  CalculatedSlotsResponse,
  AvailabilityRuleFormData,
  DateOverrideFormData,
  BlockedTimeFormData,
  RecurringBlockedTimeFormData,
  BufferSettingsFormData,
} from '../types';

// Availability Rules Hooks
export const useAvailabilityRules = () => {
  return useQuery({
    queryKey: queryKeys.availability.rules(),
    queryFn: async () => {
      const response = await api.get<{ results: AvailabilityRule[] }>('/availability/rules/');
      return response.data.results;
    },
  });
};

export const useCreateAvailabilityRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AvailabilityRuleFormData) => {
      const response = await api.post<AvailabilityRule>('/availability/rules/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.rules() });
      toast.success('Availability rule created successfully');
    },
  });
};

export const useUpdateAvailabilityRule = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<AvailabilityRuleFormData>) => {
      const response = await api.patch<AvailabilityRule>(`/availability/rules/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.rules() });
      toast.success('Availability rule updated successfully');
    },
  });
};

export const useDeleteAvailabilityRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/availability/rules/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.rules() });
      toast.success('Availability rule deleted successfully');
    },
  });
};

// Date Overrides Hooks
export const useDateOverrides = () => {
  return useQuery({
    queryKey: queryKeys.availability.overrides(),
    queryFn: async () => {
      const response = await api.get<{ results: DateOverride[] }>('/availability/overrides/');
      return response.data.results;
    },
  });
};

export const useCreateDateOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DateOverrideFormData) => {
      const response = await api.post<DateOverride>('/availability/overrides/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.overrides() });
      toast.success('Date override created successfully');
    },
  });
};

// Blocked Times Hooks
export const useBlockedTimes = () => {
  return useQuery({
    queryKey: queryKeys.availability.blockedTimes(),
    queryFn: async () => {
      const response = await api.get<{ results: BlockedTime[] }>('/availability/blocked/');
      return response.data.results;
    },
  });
};

export const useCreateBlockedTime = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BlockedTimeFormData) => {
      const response = await api.post<BlockedTime>('/availability/blocked/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.blockedTimes() });
      toast.success('Blocked time created successfully');
    },
  });
};

// Recurring Blocked Times Hooks
export const useRecurringBlockedTimes = () => {
  return useQuery({
    queryKey: queryKeys.availability.recurringBlocks(),
    queryFn: async () => {
      const response = await api.get<{ results: RecurringBlockedTime[] }>('/availability/recurring-blocks/');
      return response.data.results;
    },
  });
};

export const useCreateRecurringBlockedTime = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RecurringBlockedTimeFormData) => {
      const response = await api.post<RecurringBlockedTime>('/availability/recurring-blocks/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.recurringBlocks() });
      toast.success('Recurring blocked time created successfully');
    },
  });
};

// Buffer Settings Hooks
export const useBufferSettings = () => {
  return useQuery({
    queryKey: queryKeys.availability.bufferSettings(),
    queryFn: async () => {
      const response = await api.get<BufferSettings>('/availability/buffer/');
      return response.data;
    },
  });
};

export const useUpdateBufferSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BufferSettingsFormData) => {
      const response = await api.patch<BufferSettings>('/availability/buffer/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.availability.bufferSettings() });
      toast.success('Buffer settings updated successfully');
    },
  });
};

// Calculated Slots Hook (Main integration point for Events module)
export const useCalculatedSlots = (organizerSlug: string, params: CalculatedSlotsParams) => {
  return useQuery({
    queryKey: queryKeys.availability.calculatedSlots(organizerSlug, params),
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
      const response = await api.get<CalculatedSlotsResponse>(
        `/availability/calculated-slots/${organizerSlug}/?${searchParams}`
      );
      return response.data;
    },
    enabled: !!organizerSlug && !!params.event_type_slug && !!params.start_date && !!params.end_date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Availability Stats Hook
export const useAvailabilityStats = () => {
  return useQuery({
    queryKey: queryKeys.availability.stats(),
    queryFn: async () => {
      const response = await api.get<AvailabilityStats>('/availability/stats/');
      return response.data;
    },
  });
};