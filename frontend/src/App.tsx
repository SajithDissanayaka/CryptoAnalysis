import { useAuth } from './hooks/useAuth'

import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'


function App() {
  const {
    isAuthenticated,
    loading,
  } = useAuth()


  if (loading) {
    return <p>Loading...</p>
  }


  if (isAuthenticated) {
    return <DashboardPage />
  }


  return <LoginPage />
}


export default App