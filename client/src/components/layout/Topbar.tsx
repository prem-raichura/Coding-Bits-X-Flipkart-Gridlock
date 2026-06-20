import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Bell, ChevronDown, User, LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '../../lib/utils'

interface TopbarProps {
  onMobileMenuToggle: () => void
}

// ─── Profile dropdown ────────────────────────────────────────────────────────

function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const go = (path: string) => { setOpen(false); navigate(path) }

  return (
    <div ref={ref} className="relative">
      {/* Profile chip trigger */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-xl',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/60',
          open && 'bg-gray-100 dark:bg-gray-800',
        )}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {/* Avatar */}
        <div className={cn(
          'h-7 w-7 rounded-full flex-shrink-0',
          'bg-gradient-to-br from-brand-900 to-brand-cyan',
          'flex items-center justify-center',
          'text-white text-[11px] font-bold tracking-wide',
        )}>
          AD
        </div>

        {/* Name + role */}
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">
            Admin
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5">
            Head of Traffic
          </span>
        </div>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden sm:block"
        >
          <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-full mt-2 w-52 z-50',
              'rounded-xl border shadow-lg shadow-black/10 dark:shadow-black/40',
              'bg-white dark:bg-gray-900',
              'border-gray-200 dark:border-gray-700/80',
              'overflow-hidden',
            )}
          >
            {/* User header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-900 dark:text-white">Admin Officer</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                admin@btp.gov.in
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {[
                { icon: User, label: 'My Profile', action: () => go('/profile') },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                    'text-gray-600 dark:text-gray-300',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                    'hover:text-gray-900 dark:hover:text-white',
                    'transition-colors duration-100',
                  )}
                >
                  <Icon size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 py-1">
              <button
                onClick={() => { setOpen(false); navigate('/') }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
                  'text-critical-600 dark:text-critical-400',
                  'hover:bg-critical-50 dark:hover:bg-critical-900/20',
                  'transition-colors duration-100',
                )}
              >
                <LogOut size={14} className="flex-shrink-0" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Topbar ──────────────────────────────────────────────────────────────────

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className={cn(
      'sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-3 px-4 md:px-6',
      'bg-white/90 dark:bg-gray-950/90',
      'backdrop-blur-md',
      'border-b border-gray-200 dark:border-gray-800',
    )}>
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className={cn(
          'lg:hidden flex-shrink-0 p-2 rounded-lg',
          'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'transition-colors duration-150',
        )}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xs md:max-w-sm">
        <motion.div
          animate={{ width: searchFocused ? '100%' : '100%' }}
          transition={{ duration: 0.2 }}
          className={cn(
            'relative flex items-center gap-2 rounded-lg border px-3 py-2',
            'bg-gray-50 dark:bg-gray-900',
            'transition-all duration-200',
            searchFocused
              ? 'border-brand-cyan shadow-[0_0_0_3px_rgba(6,182,212,0.12)]'
              : 'border-gray-200 dark:border-gray-700',
          )}
        >
          <Search size={15} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            type="search"
            placeholder="Search hotspots, officers, zones…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full bg-transparent text-sm outline-none',
              'text-gray-800 dark:text-gray-200',
              'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            )}
          />
        </motion.div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notification bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative p-2 rounded-lg',
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-colors duration-150',
          )}
          aria-label="Notifications (3 unread)"
        >
          <Bell size={19} />
          <span className={cn(
            'absolute top-1.5 right-1.5',
            'h-[15px] w-[15px] rounded-full',
            'bg-critical-500 text-white',
            'text-[9px] font-bold',
            'flex items-center justify-center leading-none',
          )}>
            3
          </span>
        </motion.button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Profile dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  )
}