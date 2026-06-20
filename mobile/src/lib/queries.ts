import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export interface Cell {
  cell_id: string;
  h3_index: string;
  latitude: number | null;
  longitude: number | null;
  risk_level: string;
  predicted_violations: number | null;
  prediction_window: string;
  h3_resolution: number;
}

export interface Run {
  run_id: string;
  model_version: string;
  prediction_window: string;
}

export interface FieldValidation {
  validation_id: string;
  assignment_id: string;
  officer_id: string;
  cell_id: string;
  has_congestion: boolean;
  congestion_severity: string | null;
  dominant_vehicle_type: string | null;
  vehicle_count_approx: number | null;
  notes: string | null;
  photo_url: string | null;
  submitted_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  cell_id: string;
  run_id: string;
  status: string;
  time_limit: string | null;
  notified_at: string | null;
  opened_at: string | null;
  created_at: string;
  cell: Cell;
  run: Run;
  validation?: FieldValidation | null;
}

export interface AppNotification {
  notification_id: string;
  user_id: string;
  assignment_id: string | null;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  sent_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  police_station: string;
  avatar_url: string | null;
  number: string;
  push_token: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAssignments(status?: string) {
  const { token } = useAuth();
  return useQuery<Assignment[]>({
    queryKey: ['assignments', status],
    queryFn: () =>
      request<Assignment[]>(status ? `/assignments/me?status=${status}` : '/assignments/me', { token }),
    enabled: !!token,
    retry: 1,
  });
}

export function useAssignment(id: string) {
  const { token } = useAuth();
  return useQuery<Assignment>({
    queryKey: ['assignment', id],
    queryFn: () => request<Assignment>(`/assignments/${id}`, { token }),
    enabled: !!token && !!id,
    retry: 1,
  });
}

export function useNotifications() {
  const { token } = useAuth();
  return useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => request<AppNotification[]>('/notifications', { token }),
    enabled: !!token,
    retry: 1,
  });
}

export function useMe() {
  const { token } = useAuth();
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: () => request<User>('/auth/me', { token }),
    enabled: !!token,
    retry: 1,
  });
}

export function useOpenAssignment() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request(`/assignments/${id}`, { method: 'PATCH', body: { action: 'open' }, token }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', id] });
    },
  });
}

export function useSubmitValidation() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      assignment_id: string;
      cell_id: string;
      has_congestion: boolean;
      congestion_severity?: string;
      dominant_vehicle_type?: string;
      vehicle_count_approx?: number;
      notes?: string;
      photo_url: string;
    }) => request('/field-validations', { method: 'POST', body, token }),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['assignment', body.assignment_id] });
    },
  });
}

export function useMarkRead() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request(`/notifications/${id}/read`, { method: 'PATCH', token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRegisterPushToken() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (push_token: string) =>
      request('/users/me/push-token', { method: 'POST', body: { push_token }, token }),
  });
}
