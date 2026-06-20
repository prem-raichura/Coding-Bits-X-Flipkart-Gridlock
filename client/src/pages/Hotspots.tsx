import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import { latLngToCell, cellToBoundary } from 'h3-js'
import {
  X, Users, ZoomIn, ZoomOut, RotateCcw,
  ChevronRight, Activity, TrendingUp,
  CheckCircle, MapPin, Filter, Building2, Check,
} from 'lucide-react'
import { useHotspots, useEDIExplanations, useOfficers, useStations } from '../hooks/useMockData'
import { Skeleton } from '../components/ui/Skeleton'
import { RiskBadge } from '../components/ui/RiskBadge'
import { Badge } from '../components/ui/Badge'
import { Dialog } from '../components/ui/Dialog'
import { cn, formatNumber, formatPercent, haversineKm, getRiskBg } from '../lib/utils'
import type { Hotspot, Officer, Station, RiskLevel, EDIExplanation, OfficerStatus } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const BLR_CENTER: [number, number] = [12.97, 77.59]
const BLR_ZOOM = 12
const H3_RES = 7                           // resolution 7 → ~1.2 km edge, clearly visible at zoom 12

const RISK_COLOR: Record<RiskLevel, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#22c55e',
}

const RISK_FILTERS: Array<'All' | RiskLevel> = ['All', 'Critical', 'High', 'Medium', 'Low']

// ─── Types ────────────────────────────────────────────────────────────────────

interface HexDatum { hotspot: Hotspot; boundary: [number, number][]; cell: string }
interface OfficerWithDist extends Officer { distance_km: number; eta_min: number }

const OFFICER_STATUS_LABEL: Record<OfficerStatus, string> = {
  active:     'Active',
  on_patrol:  'On Patrol',
  available:  'Available',
  off_duty:   'Off Duty',
}

// ─── H3 hex builder — dedup by cell, keep highest hotspot_score ───────────────

function buildHexData(hotspots: Hotspot[]): HexDatum[] {
  const cells = new Map<string, { hotspot: Hotspot; cell: string }>()
  for (const h of hotspots) {
    try {
      const cell = latLngToCell(h.lat, h.lon, H3_RES)
      const cur = cells.get(cell)
      if (!cur || h.hotspot_score > cur.hotspot.hotspot_score) cells.set(cell, { hotspot: h, cell })
    } catch { /* skip bad coords */ }
  }
  const out: HexDatum[] = []
  for (const { hotspot, cell } of cells.values()) {
    try {
      out.push({ hotspot, cell, boundary: cellToBoundary(cell) as [number, number][] })
    } catch { /* skip */ }
  }
  return out
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 2800)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <motion.div
      initial={{ y: 24, opacity: 0, scale: 0.95 }}
      animate={{ y: 0,  opacity: 1, scale: 1    }}
      exit={  { y: -16, opacity: 0, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5
                 px-5 py-3 rounded-2xl bg-gray-950 text-white text-sm font-medium shadow-2xl
                 border border-white/10"
    >
      <CheckCircle size={15} className="text-low-400 flex-shrink-0" />
      {message}
    </motion.div>
  )
}

// ─── Map controller — exposes map instance via callback ──────────────────────

function MapController({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onReady(map) }, [])
  return null
}

// ─── Single hexagon polygon — memoised to prevent Leaflet DOM churn ──────────

const HexPolygon = memo(function HexPolygon({ datum, selected, onSelect, pulseTick }: {
  datum:     HexDatum
  selected:  boolean
  onSelect:  (h: Hotspot) => void
  pulseTick: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const { hotspot, boundary } = datum
  const color      = RISK_COLOR[hotspot.risk_level]
  const isCritical = hotspot.risk_level === 'Critical'

  const fillOpacity = selected
    ? 0.85
    : hovered
      ? 0.72
      : isCritical
        ? (pulseTick ? 0.60 : 0.40)
        : 0.45

  const pathOptions = useMemo(() => ({
    color,
    fillColor:   color,
    fillOpacity,
    weight:      selected ? 3 : hovered ? 2 : 1.5,
    opacity:     0.95,
    dashArray:   selected ? undefined : undefined,
  }), [color, fillOpacity, selected, hovered])

  const eventHandlers = useMemo(() => ({
    click:     () => onSelect(hotspot),
    mouseover: () => setHovered(true),
    mouseout:  () => setHovered(false),
  }), [hotspot, onSelect])

  return (
    <Polygon
      positions={boundary}
      pathOptions={pathOptions}
      eventHandlers={eventHandlers}
    />
  )
})

// ─── Map layer (hexagons + markers) ──────────────────────────────────────────

function MapLayer({ hexData, selected, onSelect, pulseTick }: {
  hexData:   HexDatum[]
  selected:  Hotspot | null
  onSelect:  (h: Hotspot) => void
  pulseTick: boolean
}) {
  return (
    <>
      {hexData.map((d) => (
        <HexPolygon
          key={d.hotspot.id}
          datum={d}
          selected={selected?.id === d.hotspot.id}
          onSelect={onSelect}
          pulseTick={pulseTick}
        />
      ))}
    </>
  )
}

// ─── Map overlay controls ────────────────────────────────────────────────────

function MapControls({
  mapRef, visibleCount, totalCount, totalPred24h, avgCongestion,
}: {
  mapRef:        React.MutableRefObject<L.Map | null>
  visibleCount:  number
  totalCount:    number
  totalPred24h:  number
  avgCongestion: number
}) {
  return (
    <>
      {/* Stats pills — top */}
      <div className="absolute top-3 left-3 right-3 z-[900] flex flex-wrap gap-2 pointer-events-none">
        {[
          { icon: MapPin,     color: '#06b6d4', label: `${visibleCount} / ${totalCount} hotspots`     },
          { icon: TrendingUp, color: '#ef4444', label: `${totalPred24h} violations predicted (24 h)` },
          { icon: Activity,   color: '#f97316', label: `Avg congestion ${avgCongestion.toFixed(1)}`   },
        ].map(({ icon: Icon, color, label }) => (
          <div
            key={label}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full
                       bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-md
                       border border-gray-200/80 dark:border-gray-700/60"
          >
            <Icon size={11} style={{ color }} className="flex-shrink-0" />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Zoom + layer controls — right side */}
      <div className="absolute top-16 right-3 z-[900] flex flex-col gap-1">
        {[
          { icon: ZoomIn,    tip: 'Zoom in',    fn: () => mapRef.current?.zoomIn()                      },
          { icon: ZoomOut,   tip: 'Zoom out',   fn: () => mapRef.current?.zoomOut()                     },
          { icon: RotateCcw, tip: 'Reset view', fn: () => mapRef.current?.setView(BLR_CENTER, BLR_ZOOM) },
        ].map(({ icon: Icon, tip, fn }) => (
          <button
            key={tip}
            onClick={fn}
            title={tip}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-md
                       border border-gray-200/80 dark:border-gray-700/60
                       text-gray-600 dark:text-gray-400
                       hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white
                       transition-colors duration-150"
          >
            <Icon size={14} />
          </button>
        ))}

      </div>

      {/* Legend — bottom left */}
      <div className="absolute bottom-5 left-3 z-[900]">
        <div className="rounded-2xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-md
                        border border-gray-200/80 dark:border-gray-700/60 px-3 py-2.5 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Risk Level
          </p>
          {(['Critical', 'High', 'Medium', 'Low'] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded flex-shrink-0 shadow-sm"
                style={{ background: RISK_COLOR[level], opacity: 0.9 }}
              />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Hotspot list card ───────────────────────────────────────────────────────

function HotspotCard({ hotspot, selected, onClick }: {
  hotspot:  Hotspot
  selected: boolean
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left',
        'border-b border-gray-100 dark:border-gray-800/70',
        'hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors duration-150',
        selected && 'bg-gradient-to-r from-blue-50 to-cyan-50/30 dark:from-blue-950/30 dark:to-cyan-950/10 border-l-2 border-l-[#06b6d4]',
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <RiskBadge level={hotspot.risk_level} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-bold font-mono text-gray-900 dark:text-gray-100">
            {hotspot.id}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 tabular-nums flex-shrink-0">
            {formatNumber(hotspot.ticket_count)}
          </span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate font-medium">
          {hotspot.dominant_junction}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-gray-400">
            Score <span className="font-bold text-gray-600 dark:text-gray-300">{hotspot.hotspot_score.toFixed(0)}</span>
          </span>
          <span className="text-[10px] text-gray-400">
            Pred <span className="font-bold text-orange-500">{hotspot.predicted_24h}</span>
          </span>
        </div>
      </div>
      <ChevronRight size={13} className="flex-shrink-0 mt-1.5 text-gray-300 dark:text-gray-600" />
    </button>
  )
}

// ─── Z-score gauge ────────────────────────────────────────────────────────────

function ZGauge({ z }: { z: number }) {
  const pct   = Math.min(Math.abs(z) / 3.5, 1) * 100
  const color = z > 2.5 ? '#ef4444' : z > 1.5 ? '#f97316' : z > 0 ? '#eab308' : '#9ca3af'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold tabular-nums w-14 text-right"
            style={{ color }}>
        {z > 0 ? '+' : ''}{z.toFixed(2)}σ
      </span>
    </div>
  )
}

// ─── SHAP driver bar ─────────────────────────────────────────────────────────

function ShapBar({ feature, shap, impact }: { feature: string; shap: number; impact: string }) {
  const pct      = Math.min(shap / 0.6, 1) * 100
  const positive = impact.includes('+')
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate max-w-[70%]">
          {feature}
        </span>
        <span className={cn('text-[10px] font-bold tabular-nums',
          positive ? 'text-critical-500' : 'text-low-500')}>
          {positive ? '+' : '−'}{(shap * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: positive ? '#ef4444' : '#22c55e' }}
        />
      </div>
    </div>
  )
}

// ─── Hotspot detail panel ─────────────────────────────────────────────────────

function HotspotDetail({ hotspot, edi, onClose, onAssign }: {
  hotspot:  Hotspot
  edi?:     EDIExplanation
  onClose:  () => void
  onAssign: () => void
}) {
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-100 dark:border-gray-800
                      bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/60 dark:to-gray-900/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-black font-mono text-gray-900 dark:text-gray-100">
                {hotspot.id}
              </span>
              <RiskBadge level={hotspot.risk_level} />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
              {hotspot.dominant_junction}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {hotspot.dominant_station} Police Station
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400
                       hover:text-gray-700 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 min-h-0">

        {/* KPI grid: risk_score, congestion_score, blockage_rate, confidence */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Risk Score',    value: hotspot.hotspot_score.toFixed(1) },
            { label: 'Congestion',    value: hotspot.congestion_score.toFixed(1) },
            { label: 'Blockage Rate', value: `${hotspot.blockage_pct}%` },
            { label: 'Confidence',    value: Math.max(0.5, Math.min(0.99, (100 - hotspot.z_score * 4) / 100)).toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label}
              className="rounded-xl border border-gray-100 dark:border-gray-700/70 p-3
                         bg-gray-50/60 dark:bg-gray-900/30">
              <p className="text-lg font-black text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Predictions: pred_24h, pred_48h */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
            Violation Forecast
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Next 24 h', value: hotspot.predicted_24h, color: '#f97316' },
              { label: 'Next 48 h', value: hotspot.predicted_48h, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label}
                className="rounded-xl border border-gray-100 dark:border-gray-700/70 p-3
                           bg-gray-50/60 dark:bg-gray-900/30 text-center">
                <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(value / 150, 1) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patterns: dominant_violation, dominant_vehicle */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
            Dominant Patterns
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-semibold', getRiskBg('High'))}>
              {hotspot.dominant_violation}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold
                             bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {hotspot.dominant_vehicle}
            </span>
          </div>
        </div>
      </div>

      {/* Assign CTA */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950/60">
        <motion.button
          onClick={onAssign}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     font-semibold text-sm text-white shadow-md
                     hover:shadow-lg transition-shadow duration-200"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 50%, #06b6d4 100%)' }}
        >
          <Users size={15} />
          Assign Officers to this Zone
        </motion.button>
      </div>
    </div>
  )
}

// ─── Station card (step 1 of assign flow) ────────────────────────────────────

function StationCard({ station, distKm, freeCount, onClick }: {
  station:   Station
  distKm:    number
  freeCount: number
  onClick:   () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150
                 border-gray-200 dark:border-gray-700
                 bg-white dark:bg-gray-900/60
                 hover:bg-blue-50 dark:hover:bg-blue-950/20
                 hover:border-blue-300 dark:hover:border-blue-700"
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}
      >
        <Building2 size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {station.name} Police Station
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {distKm.toFixed(1)} km away ·{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {freeCount} free officer{freeCount !== 1 ? 's' : ''}
          </span>
        </p>
      </div>
      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
    </motion.button>
  )
}

// ─── Assign officers dialog (2-step: station → officer multi-select) ──────────

function AssignDialog({ open, hotspot, officers, stations, onClose, onToast }: {
  open:     boolean
  hotspot:  Hotspot | null
  officers: Officer[]
  stations: Station[]
  onClose:  () => void
  onToast:  (msg: string) => void
}) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [selectedIds,     setSelectedIds]     = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) { setSelectedStation(null); setSelectedIds(new Set()) }
  }, [open, hotspot])

  const nearbyStations = useMemo((): Array<Station & { distKm: number }> => {
    if (!hotspot) return []
    return stations
      .map((s) => ({ ...s, distKm: haversineKm(hotspot.lat, hotspot.lon, s.lat, s.lon) }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 3)
  }, [hotspot, stations])

  const freeAtStation = useCallback((name: string) =>
    officers.filter((o) => o.station === name && (o.status === 'available' || o.status === 'active')),
  [officers])

  const freeOfficers = useMemo(
    () => (selectedStation ? freeAtStation(selectedStation.name) : []),
    [selectedStation, freeAtStation],
  )

  const toggleOfficer = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const handleConfirm = useCallback(() => {
    onToast(`${selectedIds.size} officer${selectedIds.size !== 1 ? 's' : ''} deployed to ${hotspot?.dominant_junction ?? 'zone'}`)
    onClose()
  }, [selectedIds.size, hotspot, onClose, onToast])

  if (!hotspot) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="max-w-lg"
      title={
        selectedStation
          ? `${selectedStation.name} Police Station`
          : 'Select Nearby Police Station'
      }
    >
      <AnimatePresence mode="wait">
        {!selectedStation ? (
          /* ── Step 1: Station selection ── */
          <motion.div
            key="stations"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0  }}
            exit={  { opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              3 nearest police stations to this hotspot
            </p>
            <div className="space-y-3">
              {nearbyStations.map((s) => (
                <StationCard
                  key={s.name}
                  station={s}
                  distKm={s.distKm}
                  freeCount={freeAtStation(s.name).length}
                  onClick={() => setSelectedStation(s)}
                />
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           text-sm font-semibold text-gray-600 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Step 2: Officer multi-select ── */
          <motion.div
            key="officers"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0  }}
            exit={  { opacity: 0, x: 12  }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Select free officers to assign to {hotspot.dominant_junction.slice(0, 44)}
            </p>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800
                            bg-white dark:bg-gray-950 divide-y divide-gray-100 dark:divide-gray-800">
              {freeOfficers.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No free officers at this station.
                </div>
              ) : (
                freeOfficers.map((o) => {
                  const initials = o.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  const checked  = selectedIds.has(o.id)
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggleOfficer(o.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                        checked
                          ? 'bg-blue-50 dark:bg-blue-950/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
                      )}
                    >
                      <div className={cn(
                        'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        checked
                          ? 'bg-brand-900 border-brand-900'
                          : 'border-gray-300 dark:border-gray-600',
                      )}>
                        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {o.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {o.badge_id} · {OFFICER_STATUS_LABEL[o.status]}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setSelectedStation(null); setSelectedIds(new Set()) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           text-sm font-semibold text-gray-600 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                Back
              </button>
              <motion.button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                whileHover={selectedIds.size > 0 ? { scale: 1.02 } : {}}
                whileTap={selectedIds.size > 0 ? { scale: 0.97 } : {}}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-opacity',
                  selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : '',
                )}
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}
              >
                Assign{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''} Officer{selectedIds.size !== 1 ? 's' : ''}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

// ─── Side panel (list ↔ detail) ───────────────────────────────────────────────

function SidePanel({ hotspots, selected, edis, onSelect, onClose, onAssign, filter }: {
  hotspots: Hotspot[]
  selected: Hotspot | null
  edis:     EDIExplanation[]
  onSelect: (h: Hotspot) => void
  onClose:  () => void
  onAssign: () => void
  filter:   'All' | RiskLevel
}) {
  const visible = filter === 'All' ? hotspots : hotspots.filter((h) => h.risk_level === filter)
  const edi     = selected ? edis.find((e) => e.hotspot_id === selected.id) : undefined

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 min-h-0">
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0  }}
            exit={  { opacity: 0, x: 16  }}
            transition={{ duration: 0.18 }}
            className="flex flex-col h-full min-h-0"
          >
            <HotspotDetail hotspot={selected} edi={edi} onClose={onClose} onAssign={onAssign} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0   }}
            exit={  { opacity: 0, x: -16  }}
            transition={{ duration: 0.18  }}
            className="flex flex-col h-full min-h-0"
          >
            {/* List header */}
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800
                            bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/60 dark:to-gray-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {visible.length} Hotspots
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Click a zone on the map or select below
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                  {filter}
                </span>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
              {visible.map((h) => (
                <HotspotCard
                  key={h.id}
                  hotspot={h}
                  selected={false}
                  onClick={() => onSelect(h)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Hotspots() {
  useEffect(() => { document.title = 'Hotspot Detection — TrafficLens' }, [])

  const locState = useLocation().state as { hotspotId?: string } | null

  const { data: hotspots, loading: hotLoad } = useHotspots()
  const { data: edis,     loading: ediLoad } = useEDIExplanations()
  const { data: officers }                   = useOfficers()
  const { data: stations }                   = useStations()

  const [filter,     setFilter]     = useState<'All' | RiskLevel>('All')
  const [selected,   setSelected]   = useState<Hotspot | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast,      setToast]      = useState<string | null>(null)
  const [pulseTick,  setPulseTick]  = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Critical hexagon pulse
  useEffect(() => {
    const id = setInterval(() => setPulseTick((t) => !t), 1200)
    return () => clearInterval(id)
  }, [])

  // Navigate-from-dashboard pre-selection
  useEffect(() => {
    if (!locState?.hotspotId || !hotspots) return
    const h = hotspots.find((x) => x.id === locState.hotspotId)
    if (h) {
      setSelected(h)
      // Pan without changing zoom so all hexagons remain visible
      mapRef.current?.panTo([h.lat, h.lon], { animate: true, duration: 0.6 })
    }
  }, [locState?.hotspotId, hotspots])

  const handleMapReady = useCallback((m: L.Map) => { mapRef.current = m }, [])

  const handleSelect = useCallback((h: Hotspot) => {
    setSelected(h)
    // Pan to hotspot — keep current zoom so other hexagons stay on screen
    mapRef.current?.panTo([h.lat, h.lon], { animate: true, duration: 0.5 })
  }, [])

  const handleClose  = useCallback(() => setSelected(null), [])
  const handleToast  = useCallback((msg: string) => setToast(msg), [])
  const handleDone   = useCallback(() => setToast(null), [])

  const filtered = useMemo(
    () => (hotspots ?? []).filter((h) => filter === 'All' || h.risk_level === filter),
    [hotspots, filter],
  )
  const hexData       = useMemo(() => buildHexData(filtered), [filtered])
  const totalPred24h  = useMemo(() => filtered.reduce((s, h) => s + h.predicted_24h, 0), [filtered])
  const avgCongestion = useMemo(
    () => filtered.length ? filtered.reduce((s, h) => s + h.congestion_score, 0) / filtered.length : 0,
    [filtered],
  )

  const isLoading = hotLoad || ediLoad

  return (
    /**
     * Outer wrapper:
     * - Negative margins escape AppShell's p-4/p-6 padding so the map runs edge-to-edge.
     * - On desktop (lg+) we pin the height to viewport-minus-topbar (h-16 = 64 px)
     *   so the whole page fits without scrolling.
     * - On mobile the height is unconstrained and the AppShell's scrollable <main>
     *   handles overflow naturally.
     */
    <div className="-mx-4 -my-4 md:-mx-6 md:-my-6 flex flex-col
                    lg:h-[calc(100vh-64px)] lg:overflow-hidden">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between
                      gap-3 px-4 md:px-6 py-3.5
                      bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm
                      border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1
            className="text-xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(90deg,#1e3a8a,#0369a1,#06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Hotspot Detection
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
            Spatio-temporal violation clusters · Bengaluru
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} className="text-gray-400 flex-shrink-0" />
          {RISK_FILTERS.map((f) => {
            const active = filter === f
            return (
              <motion.button
                key={f}
                onClick={() => { setFilter(f); setSelected(null) }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-150',
                  active
                    ? 'text-white shadow-sm'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600',
                )}
                style={active
                  ? { background: f === 'All' ? 'linear-gradient(135deg,#1e3a8a,#06b6d4)' : RISK_COLOR[f as RiskLevel] }
                  : undefined}
              >
                {f}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Body: map + panel ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><Skeleton height="h-full" /></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="h-20" />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

          {/* MAP AREA */}
          <div className="relative h-[52vh] lg:h-auto flex-1 min-h-0">
            <MapContainer
              center={BLR_CENTER}
              zoom={BLR_ZOOM}
              zoomControl={false}
              attributionControl={false}
              className="absolute inset-0 w-full h-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapController onReady={handleMapReady} />
              <MapLayer
                hexData={hexData}
                selected={selected}
                onSelect={handleSelect}
                pulseTick={pulseTick}
              />
            </MapContainer>

            {/* Overlays — rendered on top of MapContainer via absolute positioning */}
            <MapControls
              mapRef={mapRef}
              visibleCount={filtered.length}
              totalCount={hotspots?.length ?? 0}
              totalPred24h={totalPred24h}
              avgCongestion={avgCongestion}
            />
          </div>

          {/* SIDE PANEL */}
          <div className={cn(
            'flex-shrink-0 w-full lg:w-[360px] xl:w-[400px]',
            'border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800',
            'h-[48vh] lg:h-auto overflow-hidden',
            'flex flex-col min-h-0',
          )}>
            {hotspots && edis ? (
              <SidePanel
                hotspots={hotspots}
                selected={selected}
                edis={edis}
                onSelect={handleSelect}
                onClose={handleClose}
                onAssign={() => setDialogOpen(true)}
                filter={filter}
              />
            ) : (
              <div className="p-4 space-y-3 flex-1">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height="h-16" />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGN DIALOG */}
      <AssignDialog
        open={dialogOpen}
        hotspot={selected}
        officers={officers ?? []}
        stations={stations ?? []}
        onClose={() => setDialogOpen(false)}
        onToast={handleToast}
      />

      {/* TOAST */}
      <AnimatePresence>
        {toast && <Toast key="t" message={toast} onDone={handleDone} />}
      </AnimatePresence>
    </div>
  )
}
