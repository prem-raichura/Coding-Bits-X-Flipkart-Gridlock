import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './hooks/useTheme.tsx'
import { AppShell } from './components/layout/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hotspots from './pages/Hotspots'
import Congestion from './pages/Congestion'
import OfficerManagement from './pages/OfficerManagement'
import CSVUpload from './pages/CSVUpload'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

function ThemedToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      duration={4000}
      closeButton
      toastOptions={{
        style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px' },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ThemedToaster />
        <Routes>
          {/* Public routes — no shell */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated routes — wrapped in AppShell */}
          <Route path="/dashboard"  element={<AppShell><Dashboard /></AppShell>} />
          <Route path="/hotspots"   element={<AppShell><Hotspots /></AppShell>} />
          <Route path="/congestion" element={<AppShell><Congestion /></AppShell>} />
          <Route path="/officers"   element={<AppShell><OfficerManagement /></AppShell>} />
          <Route path="/csv-upload" element={<AppShell><CSVUpload /></AppShell>} />
          <Route path="/profile"   element={<AppShell><Profile /></AppShell>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
