import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  Activity,
  Users,
  Upload,
  LogOut,
  Menu,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui/Tooltip'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: LucideIcon
  path: string
}

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

// ─── Navigation config ───────────────────────────────────────────────────────

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard',          icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Hotspot Detection',  icon: Map,             path: '/hotspots' },
  { label: 'Congestion Impact',  icon: Activity,        path: '/congestion' },
  { label: 'Officer Management', icon: Users,           path: '/officers' },
]

const BOTTOM_NAV: NavItem[] = [
  { label: 'CSV Upload', icon: Upload, path: '/csv-upload' },
]

// ─── Hexagon Logo ────────────────────────────────────────────────────────────

function HexLogo() {
  return (
    <motion.div
      animate={{ filter: ['drop-shadow(0 0 4px rgba(6,182,212,0.4))', 'drop-shadow(0 0 9px rgba(6,182,212,0.75))', 'drop-shadow(0 0 4px rgba(6,182,212,0.4))'] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="flex-shrink-0 w-8 h-8"
    >
      <svg viewBox="0 0 40 46" fill="none" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="sb-ev" x1="0" y1="0" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0c1f5e" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        {/* Hexagon badge */}
        <path d="M20 1L37 10.5V29.5L20 39L3 29.5V10.5L20 1Z"
          fill="url(#sb-ev)" stroke="rgba(6,182,212,0.55)" strokeWidth="1.1" />

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
    </motion.div>
  )
}

// ─── Nav Item ────────────────────────────────────────────────────────────────

function NavItemRow({ item, collapsed, active, onClick }: {
  item: NavItem
  collapsed: boolean
  active: boolean
  onClick?: () => void
}) {
  const content = (
    <Link to={item.path} onClick={onClick} tabIndex={-1} className="block">
      <motion.div
        whileHover={{ x: collapsed ? 0 : 3 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative flex items-center rounded-xl cursor-pointer select-none',
          'transition-colors duration-150 group',
          collapsed
            ? 'justify-center w-10 h-10 mx-auto'
            : 'gap-3 px-3 py-2.5 mx-2',
          active
            ? 'bg-brand-50 dark:bg-brand-950/40'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800/60',
        )}
      >
        {/* Active left-edge bar — only in expanded mode */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-full bg-gradient-to-b from-brand-900 to-brand-cyan" />
        )}

        {/* Icon */}
        <motion.span
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex-shrink-0 transition-colors duration-150',
            active
              ? 'text-brand-700 dark:text-brand-cyan'
              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
          )}
        >
          <item.icon size={18} />
        </motion.span>

        {/* Label */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'text-sm font-medium overflow-hidden whitespace-nowrap',
                'transition-colors duration-150',
                active
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100',
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} position="right">
        {content}
      </Tooltip>
    )
  }
  return content
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar({ collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    onCloseMobile()
    navigate('/')
  }

  const sidebarWidth = collapsed ? 64 : 256

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex-shrink-0',
          'hidden lg:flex flex-col',
          'bg-white dark:bg-gray-950',
          'border-r border-gray-200 dark:border-gray-800',
          'overflow-hidden',
        )}
      >
        <SidebarInner
          collapsed={collapsed}
          isActive={isActive}
          onToggleCollapsed={onToggleCollapsed}
          onCloseMobile={onCloseMobile}
          onLogout={handleLogout}
        />
      </motion.aside>

      {/* Mobile sidebar (overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn(
              'fixed left-0 top-0 z-50 h-screen w-64 flex flex-col lg:hidden',
              'bg-white dark:bg-gray-950',
              'border-r border-gray-200 dark:border-gray-800',
              'overflow-hidden',
            )}
          >
            <SidebarInner
              collapsed={false}
              isActive={isActive}
              onToggleCollapsed={onToggleCollapsed}
              onCloseMobile={onCloseMobile}
              onLogout={handleLogout}
              isMobile
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Sidebar inner content ───────────────────────────────────────────────────

function SidebarInner({
  collapsed,
  isActive,
  onToggleCollapsed,
  onCloseMobile,
  onLogout,
  isMobile = false,
}: {
  collapsed: boolean
  isActive: (path: string) => boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
  onLogout: () => void
  isMobile?: boolean
}) {
  const isCollapsed = collapsed && !isMobile

  return (
    <div className="flex flex-col h-full">

      {/* ── Header: logo + brand text + hamburger toggle ── */}
      <div className={cn(
        'flex items-center h-16 flex-shrink-0 border-b border-gray-100 dark:border-gray-800',
        isCollapsed ? 'justify-center px-0' : 'px-4 gap-3',
      )}>
        {isCollapsed ? (
          /* Collapsed: just the hamburger toggle centered */
          <Tooltip content="Expand sidebar" position="right">
            <button
              onClick={onToggleCollapsed}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-xl',
                'text-gray-500 dark:text-gray-400',
                'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                'hover:text-gray-800 dark:hover:text-gray-200',
                'transition-colors duration-150',
              )}
              aria-label="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          </Tooltip>
        ) : (
          /* Expanded: logo + brand + hamburger on right */
          <>
            <HexLogo />
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none whitespace-nowrap">
                    TrafficLens
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5 whitespace-nowrap">
                    BTP Admin Portal
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Hamburger — desktop only */}
            {!isMobile && (
              <button
                onClick={onToggleCollapsed}
                className={cn(
                  'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg',
                  'text-gray-400 dark:text-gray-500',
                  'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                  'hover:text-gray-700 dark:hover:text-gray-300',
                  'transition-colors duration-150',
                )}
                aria-label="Collapse sidebar"
              >
                <Menu size={15} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Primary nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavItemRow
            key={item.path}
            item={item}
            collapsed={isCollapsed}
            active={isActive(item.path)}
            onClick={isMobile ? onCloseMobile : undefined}
          />
        ))}
      </nav>

      {/* ── Bottom: CSV Upload + divider + Logout ── */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 py-2">
        {/* CSV Upload */}
        {BOTTOM_NAV.map((item) => (
          <NavItemRow
            key={item.path}
            item={item}
            collapsed={isCollapsed}
            active={isActive(item.path)}
            onClick={isMobile ? onCloseMobile : undefined}
          />
        ))}

        {/* Divider */}
        <div className={cn(
          'my-2 mx-3 border-t border-gray-100 dark:border-gray-800',
          isCollapsed && 'mx-2',
        )} />

        {/* Logout */}
        {isCollapsed ? (
          <Tooltip content="Logout" position="right">
            <button
              onClick={onLogout}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-xl mx-auto',
                'text-gray-400 hover:text-critical-600 dark:hover:text-critical-400',
                'hover:bg-critical-50 dark:hover:bg-critical-900/20',
                'transition-colors duration-150',
              )}
            >
              <LogOut size={18} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 mx-0 rounded-xl',
              'text-gray-500 dark:text-gray-400 text-sm font-medium',
              'hover:bg-critical-50 hover:text-critical-600',
              'dark:hover:bg-critical-900/20 dark:hover:text-critical-400',
              'transition-colors duration-150',
            )}
          >
            <LogOut size={18} className="flex-shrink-0 ml-2" />
            <span>Logout</span>
          </button>
        )}
      </div>

    </div>
  )
}
