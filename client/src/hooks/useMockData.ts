import { useEffect, useState } from 'react'
import type {
  Hotspot,
  Station,
  Officer,
  PendingOfficer,
  DashboardKPIs,
  TimeseriesData,
  FunnelData,
  ViolationType,
  VehicleType,
  CSVUploadHistory,
  EDIExplanation,
  ActivityItem,
} from '../types'
import { BASE_URL, IS_LIVE, ENDPOINTS } from '../config/api'

import hotspotsRaw from '../mocks/hotspots.json'
import stationsRaw from '../mocks/stations.json'
import officersRaw from '../mocks/officers.json'
import pendingRaw from '../mocks/pending_officers.json'
import dashboardRaw from '../mocks/dashboard.json'
import timeseriesRaw from '../mocks/timeseries.json'
import funnelRaw from '../mocks/funnel.json'
import violationsRaw from '../mocks/violations.json'
import vehiclesRaw from '../mocks/vehicles.json'
import csvHistoryRaw from '../mocks/csv_history.json'
import ediRaw from '../mocks/edi_explanations.json'
import activityRaw from '../mocks/activity.json'

// Returns a random delay between 200 and 400 ms to simulate network latency.
function jitter(): number {
  return 200 + Math.floor(Math.random() * 200)
}

function useMock<T>(raw: T, endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (IS_LIVE) {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('btp_token') : null
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      fetch(`${BASE_URL}${endpoint}`, { headers })
        .then(r => {
          if (!r.ok) throw new Error(`Server returned ${r.status}`)
          return r.json() as Promise<unknown>
        })
        .then(json => { setData(json as T); setLoading(false) })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Failed to load data')
          setLoading(false)
        })
      return
    }
    // Mock mode — simulate network delay with static JSON
    const id = setTimeout(() => {
      setData(raw)
      setLoading(false)
    }, jitter())
    return () => clearTimeout(id)
    // raw and endpoint are module-level / call-site constants — excluded from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error }
}

export function useHotspots() {
  return useMock<Hotspot[]>(hotspotsRaw as Hotspot[], ENDPOINTS.hotspots)
}

export function useStations() {
  return useMock<Station[]>(stationsRaw as Station[], ENDPOINTS.stations)
}

export function useOfficers() {
  return useMock<Officer[]>(officersRaw as Officer[], ENDPOINTS.officers)
}

export function usePendingOfficers() {
  return useMock<PendingOfficer[]>(pendingRaw as PendingOfficer[], ENDPOINTS.pendingOfficers)
}

export function useDashboardKPIs() {
  return useMock<DashboardKPIs>(dashboardRaw as DashboardKPIs, ENDPOINTS.dashboard)
}

export function useTimeseries() {
  return useMock<TimeseriesData>(timeseriesRaw as TimeseriesData, ENDPOINTS.timeseries)
}

export function useFunnel() {
  return useMock<FunnelData>(funnelRaw as FunnelData, ENDPOINTS.funnel)
}

export function useViolations() {
  return useMock<ViolationType[]>(violationsRaw as ViolationType[], ENDPOINTS.violations)
}

export function useVehicles() {
  return useMock<VehicleType[]>(vehiclesRaw as VehicleType[], ENDPOINTS.vehicles)
}

export function useCSVHistory() {
  return useMock<CSVUploadHistory[]>(csvHistoryRaw as CSVUploadHistory[], ENDPOINTS.csvHistory)
}

export function useEDIExplanations() {
  return useMock<EDIExplanation[]>(ediRaw as EDIExplanation[], ENDPOINTS.edi)
}

export function useActivity() {
  return useMock<ActivityItem[]>(activityRaw as ActivityItem[], ENDPOINTS.activity)
}
