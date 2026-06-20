import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView, animate } from 'framer-motion'
import {
  ChevronDown, ArrowRight,
  Car, MapPin, AlertTriangle, Activity, Navigation,
  FileText, Building2, Clock, Layers,
  Code2, MessageSquare, Briefcase,
  Sun, Moon,
} from 'lucide-react'
import { cn, formatNumber } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED PARTICLE CANVAS
// ─────────────────────────────────────────────────────────────────────────────

function ParticleCanvas({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    interface Dot { x: number; y: number; vx: number; vy: number; r: number }
    const W = () => window.innerWidth
    const H = () => window.innerHeight
    const COUNT = 70, LINK = 130
    const dotColor   = isDark ? 'rgba(6,182,212,0.45)' : 'rgba(6,182,212,0.55)'
    const lineAlpha  = isDark ? 0.22 : 0.28

    const dots: Dot[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W(), H())
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > W()) d.vx *= -1
        if (d.y < 0 || d.y > H()) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = dotColor
        ctx.fill()
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(6,182,212,${(1 - dist / LINK) * lineAlpha})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
}

// ─────────────────────────────────────────────────────────────────────────────
// HEXAGON GRID BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

function HexGrid({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.18)'
  const fill   = isDark ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.07)'
  const bright = isDark ? 'rgba(6,182,212,0.3)'  : 'rgba(6,182,212,0.45)'

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lp-hex" x="0" y="0" width="58" height="50" patternUnits="userSpaceOnUse">
            <polygon points="14,2 44,2 57,25 44,48 14,48 1,25" fill="none" stroke={stroke} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lp-hex)" />
      </svg>
      {[
        { cx: '15%', cy: '25%', delay: 0   },
        { cx: '75%', cy: '18%', delay: 0.8 },
        { cx: '88%', cy: '55%', delay: 1.6 },
        { cx: '30%', cy: '72%', delay: 0.4 },
        { cx: '60%', cy: '40%', delay: 1.2 },
        { cx: '5%',  cy: '60%', delay: 2.0 },
      ].map(({ cx, cy, delay }, i) => (
        <div key={i} className="absolute animate-hexagon-pulse" style={{ left: cx, top: cy, animationDelay: `${delay}s` }}>
          <svg width="54" height="48" viewBox="0 0 54 48" fill="none">
            <polygon points="13,2 41,2 54,25 41,46 13,46 0,25" fill={fill} stroke={bright} strokeWidth="1" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING LUCIDE ICONS
// ─────────────────────────────────────────────────────────────────────────────

const FLOATERS = [
  { Icon: Car,           x: '8%',  y: '28%', size: 22, duration: 7,  delay: 0   },
  { Icon: MapPin,        x: '82%', y: '18%', size: 18, duration: 9,  delay: 1.2 },
  { Icon: AlertTriangle, x: '72%', y: '62%', size: 20, duration: 6,  delay: 0.6 },
  { Icon: Activity,      x: '18%', y: '65%', size: 16, duration: 8,  delay: 2.0 },
  { Icon: Navigation,    x: '91%', y: '82%', size: 19, duration: 10, delay: 0.3 },
]

function FloatingIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {FLOATERS.map(({ Icon, x, y, size, duration, delay }, i) => (
        <motion.div key={i} className="absolute" style={{ left: x, top: y }}
          animate={{ y: [0, -10, 0] }} transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}>
          <Icon size={size} className="text-brand-cyan opacity-[0.15]" />
        </motion.div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY SKYLINE
// ─────────────────────────────────────────────────────────────────────────────

function CityScape({ isDark }: { isDark: boolean }) {
  const bA = isDark ? 0.18 : 0.14   // building fill alpha
  const gA = isDark ? 0.10 : 0.08   // glass accent alpha

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="w-full">
        <rect x="0"    y="120" width="55"  height="40"  fill={`rgba(30,58,138,${bA})`} />
        <rect x="8"    y="95"  width="28"  height="65"  fill={`rgba(30,58,138,${bA + 0.04})`} />
        <rect x="22"   y="108" width="12"  height="52"  fill={`rgba(6,182,212,${gA})`} />
        <rect x="62"   y="80"  width="45"  height="80"  fill={`rgba(30,58,138,${bA + 0.02})`} />
        <rect x="72"   y="65"  width="18"  height="95"  fill={`rgba(30,58,138,${bA + 0.07})`} />
        <rect x="115"  y="90"  width="38"  height="70"  fill={`rgba(30,58,138,${bA})`} />
        <rect x="120"  y="72"  width="14"  height="88"  fill={`rgba(6,182,212,${gA - 0.02})`} />
        <rect x="160"  y="100" width="60"  height="60"  fill={`rgba(30,58,138,${bA - 0.02})`} />
        <rect x="175"  y="55"  width="22"  height="105" fill={`rgba(30,58,138,${bA + 0.10})`} />
        <rect x="182"  y="45"  width="8"   height="115" fill={`rgba(6,182,212,${gA + 0.02})`} />
        <rect x="230"  y="85"  width="50"  height="75"  fill={`rgba(30,58,138,${bA - 0.01})`} />
        <rect x="290"  y="75"  width="40"  height="85"  fill={`rgba(30,58,138,${bA + 0.02})`} />
        <rect x="295"  y="58"  width="16"  height="102" fill={`rgba(30,58,138,${bA + 0.10})`} />
        <rect x="380"  y="70"  width="42"  height="90"  fill={`rgba(30,58,138,${bA + 0.04})`} />
        <rect x="392"  y="48"  width="20"  height="112" fill={`rgba(30,58,138,${bA + 0.12})`} />
        <rect x="398"  y="36"  width="6"   height="124" fill={`rgba(6,182,212,${gA + 0.04})`} />
        <rect x="548"  y="50"  width="18"  height="110" fill={`rgba(30,58,138,${bA + 0.07})`} />
        <rect x="666"  y="55"  width="14"  height="105" fill={`rgba(6,182,212,${gA + 0.01})`} />
        <rect x="770"  y="60"  width="42"  height="100" fill={`rgba(30,58,138,${bA + 0.06})`} />
        <rect x="776"  y="42"  width="16"  height="118" fill={`rgba(30,58,138,${bA + 0.14})`} />
        <rect x="782"  y="30"  width="4"   height="130" fill={`rgba(6,182,212,${gA + 0.06})`} />
        <rect x="1010" y="52"  width="18"  height="108" fill={`rgba(30,58,138,${bA + 0.10})`} />
        <rect x="1016" y="38"  width="6"   height="122" fill={`rgba(6,182,212,${gA + 0.03})`} />
        <rect x="1180" y="48"  width="16"  height="112" fill={`rgba(30,58,138,${bA + 0.08})`} />
        <rect x="1365" y="52"  width="20"  height="108" fill={`rgba(30,58,138,${bA + 0.10})`} />
        <rect x="0"    y="155" width="1440" height="2"  fill="rgba(6,182,212,0.15)" />
        <rect x="0"    y="157" width="1440" height="3"  fill="rgba(30,58,138,0.25)" />
      </svg>
      <AnimatedVehicles />
    </div>
  )
}

function AnimatedVehicles() {
  const vehicles = [
    { delay: 0, y: -32, speed: 18, size: 12 },
    { delay: 5, y: -28, speed: 24, size: 10 },
    { delay: 11, y: -34, speed: 14, size: 11 },
    { delay: 3,  y: -30, speed: 20, size: 10 },
  ]
  return (
    <>
      {vehicles.map(({ delay, y, speed, size }, i) => (
        <motion.div key={i} className="absolute" style={{ bottom: Math.abs(y), left: 0 }}
          animate={{ x: ['-60px', '110vw'] }}
          transition={{ duration: speed, repeat: Infinity, ease: 'linear', delay }}>
          <Car size={size} className="text-brand-cyan opacity-30" />
        </motion.div>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HEX LOGO — camera-aperture enforcement badge
// ─────────────────────────────────────────────────────────────────────────────

function HexLogo({ size = 32 }: { size?: number }) {
  const h = Math.round(size * 1.15)
  return (
    <svg width={size} height={h} viewBox="0 0 40 46" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lp-ev" x1="0" y1="0" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0c1f5e" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {/* Hexagon badge */}
      <path d="M20 1L37 10.5V29.5L20 39L3 29.5V10.5L20 1Z"
        fill="url(#lp-ev)" stroke="rgba(6,182,212,0.55)" strokeWidth="1.1" />

      {/* 6-blade camera aperture, r=8, center=(20,20) */}
      <path d="M20 20 L20 12 A8 8 0 0 1 26.93 16 Z"    fill="rgba(255,255,255,0.84)" />
      <path d="M20 20 L26.93 16 A8 8 0 0 1 26.93 24 Z" fill="rgba(6,182,212,0.72)" />
      <path d="M20 20 L26.93 24 A8 8 0 0 1 20 28 Z"    fill="rgba(255,255,255,0.84)" />
      <path d="M20 20 L20 28 A8 8 0 0 1 13.07 24 Z"    fill="rgba(6,182,212,0.72)" />
      <path d="M20 20 L13.07 24 A8 8 0 0 1 13.07 16 Z" fill="rgba(255,255,255,0.84)" />
      <path d="M20 20 L13.07 16 A8 8 0 0 1 20 12 Z"    fill="rgba(6,182,212,0.72)" />

      {/* Scan ring */}
      <circle cx="20" cy="20" r="9.5" fill="none"
        stroke="rgba(6,182,212,0.30)" strokeWidth="0.7" strokeDasharray="2.5 2" />

      {/* Center lens */}
      <circle cx="20" cy="20" r="4.5" fill="rgba(8,18,58,0.96)" />
      <circle cx="20" cy="20" r="2.7" fill="#06b6d4" />
      <circle cx="20" cy="20" r="1.3" fill="rgba(255,255,255,0.95)" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNT-UP
// ─────────────────────────────────────────────────────────────────────────────

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration: 2, ease: 'easeOut', onUpdate: (v) => setDisplay(formatNumber(Math.round(v))) })
    return controls.stop
  }, [inView, to])

  return <span ref={ref}>{display}{suffix}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
        'border transition-all duration-200',
        isDark
          ? 'border-white/20 bg-white/8 text-gray-300 hover:border-yellow-400/50 hover:text-yellow-300 hover:bg-yellow-400/10'
          : 'border-gray-300 bg-white/70 text-gray-600 hover:border-brand-500/50 hover:text-brand-700 hover:bg-brand-50/60',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0,   opacity: 1, scale: 1   }}
          exit={  { rotate:  30, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18 }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </motion.span>
      </AnimatePresence>
      {isDark ? 'Light' : 'Dark'}
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? isDark
          ? 'bg-[#0a0e1a]/88 backdrop-blur-md border-b border-white/6 shadow-xl shadow-black/20'
          : 'bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm'
        : 'bg-transparent',
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div whileHover={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }}>
            <HexLogo size={30} />
          </motion.div>
          <span className={cn('font-bold text-lg tracking-tight transition-colors duration-200',
            isDark ? 'text-white' : scrolled ? 'text-gray-900' : 'text-gray-800')}>
            TrafficLens
          </span>
        </Link>

        {/* Right: theme toggle + login */}
        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <motion.button onClick={() => navigate('/login')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}>
            Login
          </motion.button>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className={cn(
      'relative min-h-screen flex flex-col items-center justify-center overflow-hidden',
      isDark
        ? 'bg-[#0a0e1a]'
        : 'bg-gradient-to-br from-sky-100 via-blue-50 to-slate-50',
    )}>
      <ParticleCanvas isDark={isDark} />
      <HexGrid isDark={isDark} />
      <FloatingIcons />

      {/* Radial glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        animate={{
          background: isDark
            ? [
                'radial-gradient(ellipse at center, rgba(30,58,138,0.35) 0%, transparent 70%)',
                'radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, transparent 70%)',
                'radial-gradient(ellipse at center, rgba(30,58,138,0.35) 0%, transparent 70%)',
              ]
            : [
                'radial-gradient(ellipse at center, rgba(30,58,138,0.08) 0%, transparent 70%)',
                'radial-gradient(ellipse at center, rgba(6,182,212,0.10) 0%, transparent 70%)',
                'radial-gradient(ellipse at center, rgba(30,58,138,0.08) 0%, transparent 70%)',
              ],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-8 border',
            isDark
              ? 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'
              : 'border-brand-500/25 bg-brand-50/80 text-brand-700',
          )}>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
          Bengaluru Traffic Police — Command Intelligence Portal
        </motion.div>

        {/* Heading */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="animate-gradient-shift font-black tracking-tight leading-none mb-6"
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 7.5rem)',
            background: 'linear-gradient(90deg,#1e3a8a,#06b6d4,#3b82f6,#06b6d4,#1e3a8a)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
          TrafficLens
        </motion.h1>

        {/* Subheading */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className={cn('text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed',
            isDark ? 'text-gray-400' : 'text-gray-600')}>
          AI-powered parking enforcement intelligence for Bengaluru. Detect hotspots,
          predict congestion, optimize officer deployment.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(6,182,212,0.35)' }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)' }}>
            Get Started <ArrowRight size={16} />
          </motion.button>
          <motion.button onClick={() => alert('Mobile app coming soon')}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={cn(
              'inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
              isDark
                ? 'border border-white/20 text-gray-300 hover:border-brand-cyan/50 hover:text-white bg-white/5 hover:bg-white/10'
                : 'border border-gray-300 text-gray-600 hover:border-brand-500/50 hover:text-brand-700 bg-white/60 hover:bg-white',
            )}>
            Download Mobile App
          </motion.button>
        </motion.div>
      </div>

      <CityScape isDark={isDark} />

      {/* Scroll indicator */}
      <motion.div className={cn('absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1',
          isDark ? 'text-gray-600' : 'text-gray-400')}
        animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true">
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { icon: FileText,  value: 298450, suffix: '+', label: 'Violations Analyzed',  sub: 'From Nov 2023 – Apr 2024' },
  { icon: Building2, value: 54,     suffix: '',  label: 'Police Stations',       sub: 'Connected across Bengaluru' },
  { icon: Layers,    value: 35,     suffix: '',  label: 'Active Hotspots',        sub: 'Continuously monitored' },
  { icon: Clock,     value: 0,      suffix: '',  label: '24/7 Intelligence',     sub: 'Real-time anomaly detection', display: '24/7' },
]

function StatsSection() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className={cn('py-24 px-4 sm:px-6 border-t',
        isDark ? 'bg-[#0a0e1a] border-white/5' : 'bg-white border-gray-200/60')}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan mb-3">
            Impact By The Numbers
          </p>
          <h2 className={cn('text-3xl sm:text-4xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            Bengaluru's enforcement backbone
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map(({ icon: Icon, value, suffix, label, sub, display }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl p-6 border overflow-hidden group transition-colors duration-200',
                isDark
                  ? 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
                  : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md',
              )}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(circle at top right, rgba(6,182,212,0.10), transparent 70%)' }} />

              <div className="mb-4 inline-flex p-2.5 rounded-xl"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Icon size={18} className="text-brand-cyan" />
              </div>

              <p className="text-3xl sm:text-4xl font-black tracking-tight mb-1"
                style={{ background: 'linear-gradient(90deg,#1e3a8a,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {display ? display : <CountUp to={value} suffix={suffix} />}
              </p>

              <p className={cn('text-sm font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>{label}</p>
              <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>{sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  { heading: 'Product',   links: ['Features', 'Analytics', 'Hotspot Map', 'API'] },
  { heading: 'Company',   links: ['About', 'Team', 'BTP Partnership', 'Contact'] },
  { heading: 'Resources', links: ['Documentation', 'GitHub', 'Support', 'Privacy'] },
]
const SOCIAL_LINKS = [
  { icon: Code2,         label: 'GitHub'   },
  { icon: MessageSquare, label: 'Twitter'  },
  { icon: Briefcase,     label: 'LinkedIn' },
]

function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer className={cn('border-t py-14 px-4 sm:px-6',
        isDark ? 'bg-[#040609] border-white/5' : 'bg-gray-50 border-gray-200')}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <HexLogo size={26} />
              <span className={cn('font-bold text-base', isDark ? 'text-white' : 'text-gray-900')}>TrafficLens</span>
            </div>
            <p className={cn('text-xs leading-relaxed mb-5', isDark ? 'text-gray-600' : 'text-gray-500')}>
              AI-powered parking enforcement intelligence, built for Bengaluru Traffic Police.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
                <button key={label} aria-label={label}
                  className={cn('p-2 rounded-lg transition-colors duration-150',
                    isDark ? 'text-gray-600 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100')}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          {FOOTER_COLS.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className={cn('text-xs font-semibold uppercase tracking-widest mb-4',
                  isDark ? 'text-gray-500' : 'text-gray-400')}>
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className={cn('text-xs transition-colors duration-150',
                        isDark ? 'text-gray-600 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800')}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={cn('border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3',
            isDark ? 'border-white/5' : 'border-gray-200')}>
          <p className={cn('text-xs', isDark ? 'text-gray-700' : 'text-gray-400')}>
            © 2024 TrafficLens. Built for Bengaluru Traffic Police.
          </p>
          <p className={cn('text-xs', isDark ? 'text-gray-700' : 'text-gray-400')}>
            Parking Enforcement Intelligence Platform
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Landing() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => { document.title = 'TrafficLens — BTP Parking Intelligence' }, [])

  return (
    <div className={isDark ? 'bg-[#0a0e1a]' : 'bg-sky-50'}>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <Footer />
    </div>
  )
}
