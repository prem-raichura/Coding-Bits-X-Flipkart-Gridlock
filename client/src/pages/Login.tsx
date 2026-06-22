import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// HEX LOGO  — camera-aperture enforcement badge
// ─────────────────────────────────────────────────────────────────────────────

function HexLogo({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="ParkVUE"
      className="object-contain select-none"
      draggable={false}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL DECORATIVE ELEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const MINI_HEXES = [
  { w: 52, x: '8%',  y: '12%', delay: 0,   opacity: 0.18 },
  { w: 36, x: '78%', y: '8%',  delay: 0.5, opacity: 0.12 },
  { w: 68, x: '82%', y: '30%', delay: 1.0, opacity: 0.10 },
  { w: 44, x: '5%',  y: '55%', delay: 1.4, opacity: 0.14 },
  { w: 58, x: '70%', y: '68%', delay: 0.7, opacity: 0.12 },
  { w: 32, x: '88%', y: '82%', delay: 1.8, opacity: 0.09 },
  { w: 48, x: '20%', y: '80%', delay: 0.3, opacity: 0.13 },
  { w: 40, x: '55%', y: '20%', delay: 1.1, opacity: 0.10 },
]

function FloatingHex({ w, x, y, delay, opacity }: typeof MINI_HEXES[number]) {
  const hh = Math.round(w * 1.16)
  return (
    <motion.div className="absolute pointer-events-none" style={{ left: x, top: y }}
      animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}>
      <svg width={w} height={hh} viewBox="0 0 36 42" fill="none">
        <path d="M18 2L33.59 11V29L18 38L2.41 29V11L18 2Z"
          fill="rgba(30,58,138,0.05)"
          stroke={`rgba(6,182,212,${opacity})`}
          strokeWidth="1" />
      </svg>
    </motion.div>
  )
}

function AnimatedStreak({ x1, y1, x2, y2, delay }: {
  x1: string; y1: string; x2: string; y2: string; delay: number
}) {
  return (
    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div className="absolute rounded-full"
        style={{
          left: x1, top: y1, width: 1, height: 1,
          background: 'rgba(6,182,212,0.8)',
          boxShadow: '0 0 6px 2px rgba(6,182,212,0.5)',
        }}
        animate={{ left: [x1, x2], top: [y1, y2], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay, repeatDelay: 4 }} />
    </motion.div>
  )
}

function LeftPanel() {
  const panelBg = 'linear-gradient(160deg, #dbeafe 0%, #bfdbfe 35%, #eff6ff 70%, #f0f9ff 100%)'
  const gridStroke = 'rgba(30,58,138,0.07)'
  const radialGlow = 'radial-gradient(ellipse at 50% 45%, rgba(30,58,138,0.12) 0%, transparent 65%)'

  return (
    <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden lg:flex relative w-1/2 flex-col items-center justify-center overflow-hidden"
      style={{ background: panelBg }}>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="lg-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke={gridStroke} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lg-grid)" />
        </svg>
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: radialGlow }} aria-hidden="true" />

      {/* Mini hexagons */}
      {MINI_HEXES.map((h, i) => <FloatingHex key={i} {...h} />)}

      {/* Animated streaks */}
      <AnimatedStreak x1="20%" y1="10%" x2="75%" y2="45%" delay={0}   />
      <AnimatedStreak x1="65%" y1="75%" x2="15%" y2="40%" delay={2.5} />
      <AnimatedStreak x1="50%" y1="20%" x2="80%" y2="70%" delay={5}   />

      {/* Brand gradient bar — top */}
      <div className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, #1e3a8a, #06b6d4, #1e3a8a)' }}
        aria-hidden="true" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-12 select-none">
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 8px rgba(6,182,212,0.5))',
              'drop-shadow(0 0 18px rgba(6,182,212,0.8))',
              'drop-shadow(0 0 8px rgba(6,182,212,0.5))',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-5">
          <HexLogo size={56} />
        </motion.div>

        <h1 className="text-4xl font-black tracking-tight mb-3"
          style={{
            background: 'linear-gradient(90deg, #60a5fa, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
          ParkVUE
        </h1>

        <p className="text-sm font-medium uppercase tracking-widest mb-8 transition-colors duration-300 text-blue-600">
          Keep Bengaluru Moving        </p>

        <div className="w-12 h-[2px] rounded-full mb-8"
          style={{ background: 'linear-gradient(90deg, #1e3a8a, #06b6d4)' }} />

        <p className="text-base leading-relaxed max-w-[320px] transition-colors duration-300 text-gray-700">
          Welcome back. Bengaluru's enforcement intelligence awaits.
        </p>

        {/* Stat pills */}
        <div className="mt-12 flex flex-col gap-3 w-full max-w-[280px]">
          {[
            { label: '298,450+ violations analyzed' },
            { label: '54 stations networked'         },
            { label: 'Real-time anomaly detection'   },
          ].map(({ label }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(6,182,212,0.30)',
              }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#06b6d4', boxShadow: '0 0 5px rgba(6,182,212,0.7)' }} />
              <span className="text-xs transition-colors duration-300 text-gray-700">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE TOP BANNER
// ─────────────────────────────────────────────────────────────────────────────

function MobileBanner() {
  return (
    <div className="lg:hidden flex items-center justify-center h-20 flex-shrink-0 transition-all duration-300"
      style={{ background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)' }}>
      <div className="flex items-center gap-3">
        <HexLogo size={30} />
        <div>
          <p className="font-bold text-base leading-none transition-colors duration-300 text-gray-900">
            ParkVUE
          </p>
          <p className="text-[10px] leading-none mt-0.5 transition-colors duration-300 text-gray-600">
            Keep Bengaluru Moving          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELD
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  left: React.ReactNode
  right?: React.ReactNode
  autoComplete?: string
}

function Field({ id, label, type, value, onChange, placeholder, left, right, autoComplete }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      <div className={cn(
        'relative flex items-center rounded-xl border transition-all duration-200',
        'bg-gray-50',
        'border-gray-200',
        'focus-within:border-brand-cyan focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]',
      )}>
        <span className="absolute left-3.5 flex-shrink-0 text-gray-400 pointer-events-none">
          {left}
        </span>
        <input id={id} type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className={cn(
            'w-full bg-transparent py-3 pl-10 text-sm outline-none',
            right ? 'pr-10' : 'pr-4',
            'text-gray-900',
            'placeholder:text-gray-400',
          )} />
        {right && <span className="absolute right-3.5 flex-shrink-0">{right}</span>}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// LOGIN FORM PANEL
// ─────────────────────────────────────────────────────────────────────────────

function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn(
      'flex flex-1 lg:w-1/2 items-center justify-center overflow-y-auto',
      'px-4 py-8 sm:px-8',
      'bg-gray-50',
    )}>
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[400px]">

        {/* Card */}
        <div className={cn(
          'rounded-2xl p-8 sm:p-10',
          'bg-white/80',
          'backdrop-blur-xl',
          'border border-gray-200/80',
          'shadow-xl shadow-black/5',
        )}>
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Sign in to ParkVUE
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Access the admin command center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="username" label="Username" type="text"
              value={username} onChange={setUsername}
              placeholder="admin" autoComplete="username"
              left={<Mail size={15} />} />

            <Field id="password" label="Password" type={showPwd ? 'text' : 'password'}
              value={password} onChange={setPassword}
              placeholder="Enter your password" autoComplete="current-password"
              left={<Lock size={15} />}
              right={
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              } />

            <motion.button type="submit" disabled={loading}
              whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className={cn(
                'mt-2 w-full py-3 rounded-xl font-semibold text-sm text-white',
                'flex items-center justify-center gap-2',
                'transition-opacity duration-150',
                loading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span key="spinner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    Sign In <ArrowRight size={15} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.45 }}
          className="mt-5 text-center">
          <Link to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400
                       hover:text-gray-600 transition-colors duration-150">
            <ArrowLeft size={12} />
            Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  useEffect(() => { document.title = 'Sign In — ParkVUE' }, [])
  return (
    <div className="relative flex h-screen overflow-hidden flex-col lg:flex-row">
      <LeftPanel />
      <MobileBanner />
      <LoginForm />
    </div>
  )
}
