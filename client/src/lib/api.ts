import { BASE_URL } from '../config/api'

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
}

function getToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem('btp_token') : null
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = opts.token ?? getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Request failed (${res.status})`)
  }
  return json as T
}

// ── officer-lifecycle helpers ────────────────────────────────────────────────

export interface NearestStation {
  id: string
  name: string
  code: string | null
  latitude: number
  longitude: number
  distance_km: number
}

export interface StationOfficer {
  id: string
  name: string
  badge_id: string
  station: string
  status: string
  last_lat: number
  last_lon: number
  total_tickets: number
  active_assignments: number
  approval_rate: number
  effectiveness_score: number
}

export interface UnassignRequest {
  id: string
  reason: string
  status: string
  created_at: string
  officer: { id: string; name: string; police_station: string }
  assignment: { id: string; cell: { h3_index: string; latitude: number; longitude: number; risk_level: string } }
}

export interface GeofenceBreach {
  id: string
  officer_id: string
  officer_name: string
  station: string
  assignment_id: string
  zone: string | null
  risk_level: string | null
  latitude: number
  longitude: number
  distance_m: number | null
  at: string
}

export const getNearestStations = (lat: number, lon: number, n = 2) =>
  request<NearestStation[]>(`/stations/nearest?lat=${lat}&lon=${lon}&n=${n}`)

export const getStationOfficers = (stationId: string, availability?: string) =>
  request<StationOfficer[]>(`/stations/${stationId}/officers${availability ? `?availability=${availability}` : ''}`)

export const assignOfficer = (body: { user_id: string; h3_index: string; time_limit?: string }) =>
  request<{ id: string }>(`/officers/assign`, { method: 'POST', body })

export const getUnassignRequests = (status = 'pending') =>
  request<UnassignRequest[]>(`/unassign-requests?status=${status}`)

export const approveUnassign = (id: string) =>
  request(`/unassign-requests/${id}/approve`, { method: 'POST', body: {} })

export const rejectUnassign = (id: string) =>
  request(`/unassign-requests/${id}/reject`, { method: 'POST', body: {} })

export const cancelAssignment = (id: string, reason?: string) =>
  request(`/assignments/${id}/cancel`, { method: 'POST', body: { reason } })

export const getGeofenceBreaches = () => request<GeofenceBreach[]>(`/location/breaches`)

export const getAssignments = (status?: string) =>
  request<unknown[]>(`/assignments${status ? `?status=${status}` : ''}`)

export async function uploadCsv(file: File, token: string | null): Promise<{ run_id: string; status: string }> {
  const fd = new FormData()
  fd.append('file', file)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/csv`, {
    method: 'POST',
    headers,
    body: fd,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Upload failed (${res.status})`)
  }
  return json as { run_id: string; status: string }
}
