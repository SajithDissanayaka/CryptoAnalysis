import { useAuth } from '../hooks/useAuth'


function DashboardPage() {
  const {user,logout,} = useAuth()


  return (
    <div>
      <h1>CryptoMind AI Dashboard</h1>

      <h2>
        Welcome, {user?.username}
      </h2>

      <p>
        Email: {user?.email}
      </p>

      <p>
        Account Status:{' '}
        {user?.is_active ? 'Active' : 'Inactive'}
      </p>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  )
}


export default DashboardPage