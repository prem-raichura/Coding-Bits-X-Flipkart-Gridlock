import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PageTransition } from './PageTransition'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cn } from '../../lib/utils'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const mainRef = useRef<HTMLElement>(null)

  // Desktop: expanded (256) or icon-only (64)
  const [collapsed, setCollapsed] = useState(false)
  // Mobile: sidebar overlay open
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar and scroll to top whenever the route changes
  useEffect(() => {
    setMobileOpen(false)
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  // Close mobile sidebar when resizing up to desktop
  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  const sidebarWidth = collapsed ? 64 : 256

  return (
    <div className={cn(
      'flex h-screen overflow-hidden',
    )}>
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* ── Mobile backdrop ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Main column (topbar + scrollable content) ──────────── */}
      <motion.div
        className="flex flex-1 flex-col overflow-hidden min-w-0"
        animate={{ paddingLeft: isDesktop ? sidebarWidth : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Topbar onMobileMenuToggle={() => setMobileOpen((o) => !o)} />

        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 min-h-full">
            <PageTransition locationKey={location.pathname}>
              {children}
            </PageTransition>
          </div>
        </main>
      </motion.div>
    </div>
  )
}
