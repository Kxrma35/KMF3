import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './firebase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Progress from './pages/Progress'
import Insights from './pages/Insights'
import Settings from './pages/Settings'

function App() {
  const [user, loading] = useAuthState(auth)

  if (loading) return <p>Loading...</p>

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
      <Route path="/progress" element={user ? <Progress /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default App