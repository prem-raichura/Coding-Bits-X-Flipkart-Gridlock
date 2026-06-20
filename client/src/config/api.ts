/**
 * BACKEND CONNECTION POINT
 * ========================
 * Backend team: when the Express/Prisma server is ready, change BASE_URL below
 * to point to your running backend (e.g. http://localhost:3000/api).
 * Set VITE_API_URL in client/.env.local to override at runtime.
 *
 * All hooks in src/hooks/useMockData.ts will automatically switch from JSON mocks
 * to live API calls when BASE_URL is non-empty.
 */
export const BASE_URL = import.meta.env.VITE_API_URL || ''

export const ENDPOINTS = {
  hotspots:        '/hotspots',
  stations:        '/stations',
  officers:        '/officers',
  pendingOfficers: '/officers/pending',
  dashboard:       '/dashboard',
  timeseries:      '/timeseries',
  funnel:          '/funnel',
  violations:      '/violations',
  vehicles:        '/vehicles',
  csvHistory:      '/csv/history',
  csvUpload:       '/csv',
  edi:             '/edi/explanations',
  activity:        '/activity',
  assignOfficer:   '/officers/assign',
  approveOfficer:  '/officers/approve',
  rejectOfficer:   '/officers/reject',
  // officer-lifecycle additions
  stationsMaster:  '/stations/master',
  nearestStations: '/stations/nearest',
  unassignRequests:'/unassign-requests',
  geofenceBreaches:'/location/breaches',
  assignments:     '/assignments',
}

export const IS_LIVE = BASE_URL.length > 0
