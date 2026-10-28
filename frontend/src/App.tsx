import { Navigate, Route, Routes, Link } from 'react-router'
import ProtectedRoute from './components/ProtectedRoute'
import WorkspaceLayout from './components/WorkspaceLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CryptoAIPage from './pages/CryptoAIPage'
import ResearchPage from './pages/ResearchPage'
import { Brand } from './components/Icon'

function WorkspaceRoutes() {
  return <WorkspaceLayout />
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/explore" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/explore" element={<WorkspaceRoutes />}>
        <Route index element={<DashboardPage />} />
        <Route path="ai" element={<CryptoAIPage />} />
        <Route path="research" element={<ResearchPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<WorkspaceRoutes />}>
          <Route index element={<DashboardPage />} />
          <Route path="ai" element={<CryptoAIPage />} />
          <Route path="research" element={<ResearchPage />} />
        </Route>
        <Route path="/ai" element={<Navigate to="/dashboard/ai" replace />} />
      </Route>
      <Route
        path="*"
        element={
          <main className="not-found">
            <Brand />
            <span className="eyebrow">OFF THE CHARTS / 404</span>
            <h1>
              A little outside
              <br />
              the market.
            </h1>
            <p>This page couldn't be found. Your workspace is one click away.</p>
            <Link className="button button-mint" to="/">
              Back to overview →
            </Link>
          </main>
        }
      />
    </Routes>
  )
}
