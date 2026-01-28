import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Team from './pages/Team'
import Leave from './pages/Leave'
import Users from './pages/Users'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { hasAccess } from './utils/roleAccess'

const ProtectedRoute = ({ pageName, children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasAccess(user, pageName)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route
              path="team"
              element={
                <ProtectedRoute pageName="Team">
                  <Team />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave"
              element={
                <ProtectedRoute pageName="Leave">
                  <Leave />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute pageName="Users">
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
