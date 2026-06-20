import { useState } from 'react'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User, Mail, Phone, Shield, Building2,
  BadgeCheck, MapPin, Clock, CheckCircle2,
  Camera, Lock,
} from 'lucide-react'
import { cn } from '../lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileData {
  fullName:   string
  email:      string
  phone:      string
  role:       string
  department: string
  badgeId:    string
  station:    string
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL: ProfileData = {
  fullName:   'Admin Officer',
  email:      'admin@btp.gov.in',
  phone:      '+91 98765 43210',
  role:       'Head of Traffic',
  department: 'Traffic Enforcement Division',
  badgeId:    'BTP-ADM-001',
  station:    'Central Command Station, Bengaluru',
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELD
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label:       string
  icon:        React.ReactNode
  value:       string
  onChange:    (v: string) => void
  type?:       string
  placeholder?: string
  readOnly?:   boolean
  hint?:       string
}

function Field({ label, icon, value, onChange, type = 'text', placeholder, readOnly = false, hint }: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {icon}
        {label}
        {readOnly && (
          <span className="ml-auto text-[10px] font-normal normal-case text-gray-400 dark:text-gray-600">
            read-only
          </span>
        )}
      </label>
      <div className={cn(
        'relative flex items-center rounded-xl border transition-all duration-200',
        readOnly
          ? 'bg-gray-50/80 dark:bg-gray-900/30 border-gray-200/60 dark:border-gray-800/60'
          : 'bg-white dark:bg-gray-900/60 border-gray-200 dark:border-gray-700/80',
        !readOnly && focused
          ? 'border-brand-cyan shadow-[0_0_0_3px_rgba(6,182,212,0.12)]'
          : '',
      )}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent py-3 px-4 text-sm outline-none rounded-xl',
            readOnly
              ? 'text-gray-500 dark:text-gray-500 cursor-default'
              : 'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
          )}
        />
      </div>
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-600 pl-1">{hint}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-2xl border p-6',
      'bg-white dark:bg-gray-900/50',
      'border-gray-200 dark:border-gray-800',
      'shadow-sm',
    )}>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-brand-900 to-brand-cyan" />
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="relative inline-block group">
      <motion.div
        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-black tracking-wide select-none"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(6,182,212,0)',
            '0 0 0 8px rgba(6,182,212,0.15)',
            '0 0 0 0 rgba(6,182,212,0)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {initials}
      </motion.div>
      {/* Camera overlay on hover */}
      <button
        className={cn(
          'absolute inset-0 rounded-full flex items-center justify-center',
          'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'text-white',
        )}
        aria-label="Change avatar"
      >
        <Camera size={20} />
      </button>
      {/* Online indicator */}
      <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  useEffect(() => { document.title = 'Admin Profile — TrafficLens' }, [])

  const [data,    setData]    = useState<ProfileData>(INITIAL)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const set = (key: keyof ProfileData) => (val: string) =>
    setData((d) => ({ ...d, [key]: val }))

  const initials = data.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    toast.success('Profile updated successfully', {
      description: 'Your changes have been saved.',
      icon: <CheckCircle2 size={16} />,
    })
    setTimeout(() => setSaved(false), 2500)
  }

  const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Page heading */}
      <FadeUp>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your personal details and contact information.
          </p>
        </div>
      </FadeUp>

      {/* ── Profile hero card ── */}
      <FadeUp delay={0.08}>
        <div className={cn(
          'rounded-2xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5',
          'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 shadow-sm',
          'relative overflow-hidden',
        )}>
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, rgba(6,182,212,0.07), transparent 70%)' }} />

          <Avatar initials={initials} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {data.fullName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{data.email}</p>
              </div>
              <span className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}>
                <BadgeCheck size={11} />
                {data.role}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Shield size={11} className="text-brand-cyan" />
                {data.badgeId}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={11} className="text-brand-cyan" />
                {data.station}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="text-brand-cyan" />
                Last login: Today, 9:45 AM
              </span>
            </div>
          </div>

          {/* Status chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </div>
        </div>
      </FadeUp>

      {/* ── Personal Information ── */}
      <FadeUp delay={0.14}>
        <Section title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Full Name"
              icon={<User size={12} />}
              value={data.fullName}
              onChange={set('fullName')}
              placeholder="Enter full name"
            />
            <Field
              label="Email Address"
              icon={<Mail size={12} />}
              value={data.email}
              onChange={set('email')}
              type="email"
              placeholder="officer@btp.gov.in"
              hint="Used for login and notifications"
            />
            <Field
              label="Phone Number"
              icon={<Phone size={12} />}
              value={data.phone}
              onChange={set('phone')}
              type="tel"
              placeholder="+91 XXXXX XXXXX"
            />
            <Field
              label="Role / Title"
              icon={<BadgeCheck size={12} />}
              value={data.role}
              onChange={set('role')}
              placeholder="e.g. Head of Traffic"
            />
          </div>
        </Section>
      </FadeUp>

      {/* ── Organisational Details ── */}
      <FadeUp delay={0.20}>
        <Section title="Organisational Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Department"
              icon={<Building2 size={12} />}
              value={data.department}
              onChange={set('department')}
              placeholder="Division name"
            />
            <Field
              label="Badge ID"
              icon={<Shield size={12} />}
              value={data.badgeId}
              onChange={set('badgeId')}
              placeholder="BTP-XXX-000"
              hint="Assigned by BTP administration"
            />
            <div className="sm:col-span-2">
              <Field
                label="Station"
                icon={<MapPin size={12} />}
                value={data.station}
                onChange={set('station')}
                placeholder="Station name and location"
              />
            </div>
          </div>
        </Section>
      </FadeUp>

      {/* ── Account Info ── */}
      <FadeUp delay={0.26}>
        <Section title="Account Information">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Access Level"
              icon={<Shield size={12} />}
              value="Administrator"
              onChange={() => {}}
              readOnly
            />
            <Field
              label="Account Status"
              icon={<CheckCircle2 size={12} />}
              value="Active"
              onChange={() => {}}
              readOnly
            />
            <Field
              label="Last Login"
              icon={<Clock size={12} />}
              value="Today, 9:45 AM"
              onChange={() => {}}
              readOnly
            />
          </div>

          {/* Change password link */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Lock size={13} />
              Password last changed 30 days ago
            </div>
            <button className="text-xs font-semibold text-brand-cyan hover:text-brand-500 transition-colors duration-150">
              Change Password
            </button>
          </div>
        </Section>
      </FadeUp>

      {/* ── Save Button ── */}
      <FadeUp delay={0.32}>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setData(INITIAL)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
              'border border-gray-200 dark:border-gray-700',
              'text-gray-600 dark:text-gray-400',
              'hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200',
            )}
          >
            Reset
          </button>

          <motion.button
            type="button"
            onClick={handleSave}
            disabled={saving}
            whileHover={saving ? {} : { scale: 1.03, boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
            whileTap={saving ? {} : { scale: 0.97 }}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white',
              'transition-all duration-200',
              saving ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer',
            )}
            style={{ background: saved ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#1e3a8a,#06b6d4)' }}
          >
            {saving ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Saving…
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={15} />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </FadeUp>

    </div>
  )
}
