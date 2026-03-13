import { Navigate, Outlet } from 'react-router'
import { getStoredSession } from '../utils/auth'

const App = () => {
  const session = getStoredSession()

  if (!session) {
    return <Navigate to='/login' replace />
  }

  return (
    <Outlet />
  )
}

export default App
