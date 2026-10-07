import { Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { EmergencySummaryPage } from './pages/EmergencySummaryPage'

/**
 * Route contract: the backend builds publicUrl as
 * `${PUBLIC_RESPONDER_WEB_BASE_URL}/passes/{token}`
 * (apps/api/.../pass/EmergencyPassService.java) -- keep this path in sync
 * with that value if it ever changes.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/passes/:token" element={<EmergencySummaryPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}
