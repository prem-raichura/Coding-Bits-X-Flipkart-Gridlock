import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.tsx'
import { cn } from '../../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative h-8 w-[52px] rounded-full border transition-colors duration-300 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-cyan/60 focus-visible:ring-offset-1',
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-amber-100 border-amber-200',
        className,
      )}
    >
      {/* Sliding thumb */}
      <motion.div
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full shadow-sm',
          'flex items-center justify-center',
          isDark ? 'bg-gray-600' : 'bg-white',
        )}
        animate={{ left: isDark ? 26 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18 }}
            >
              <Moon size={12} className="text-brand-cyan" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.18 }}
            >
              <Sun size={12} className="text-amber-500" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  )
}
