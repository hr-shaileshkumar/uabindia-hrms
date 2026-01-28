import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState, useRef } from 'react'
import logo from '../assets/logo.png'
import { hasAccess } from '../utils/roleAccess'

const Layout = () => {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const [showUsersMenu, setShowUsersMenu] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const usersMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (usersMenuRef.current && !usersMenuRef.current.contains(event.target)) {
        setShowUsersMenu(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDetails(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return null
  }

  const displayName = user.fullName?.trim() && user.fullName.trim() !== 'Admin User'
    ? user.fullName.trim()
    : user.role

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U'

  const districtLabel = user?.districts?.length
    ? user.districts.join(', ')
    : (user?.role === 'Admin' || user?.role === 'Department' ? 'All' : 'Not mapped')
  const blockLabel = user?.blocks?.length
    ? user.blocks.join(', ')
    : (user?.role === 'Admin' || user?.role === 'Department' ? 'All' : 'Not mapped')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-28 sm:h-12 sm:w-32 flex items-center justify-center rounded-xl bg-white">
                <img
                  src={logo}
                  alt="UABIndia Hrms"
                  className="h-10 w-24 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-600">UABIndia Hrms</h1>
                <p className="text-xs text-gray-500">Animal Treatment Feedback System</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                {hasAccess(user, 'Dashboard') && (
                  <Link
                    to="/"
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                  >
                    Dashboard
                  </Link>
                )}
                {hasAccess(user, 'Team') && (
                  <Link
                    to="/team"
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                  >
                    Team
                  </Link>
                )}
                {hasAccess(user, 'Leave') && (
                  <Link
                    to="/leave"
                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                  >
                    Leave
                  </Link>
                )}
                {hasAccess(user, 'Users') && (
                  <div className="relative" ref={usersMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowUsersMenu(prev => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition"
                    >
                      Users ▾
                    </button>
                    {showUsersMenu && (
                      <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
                        <Link
                          to="/users?section=create"
                          onClick={() => setShowUsersMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Create User
                        </Link>
                        <Link
                          to="/users?section=role-access"
                          onClick={() => setShowUsersMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Role Access
                        </Link>
                        <Link
                          to="/users?section=access"
                          onClick={() => setShowUsersMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          User Access
                        </Link>
                        <Link
                          to="/users?section=list"
                          onClick={() => setShowUsersMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          User List
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Refresh
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDetails(prev => !prev)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm hover:bg-gray-50 transition"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-semibold">
                    {initials}
                  </span>
                  <span className="text-sm text-gray-700">{displayName}</span>
                </button>
                {showUserDetails && (
                  <div className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg z-20 p-4">
                    <div className="text-sm font-semibold text-gray-800">{displayName}</div>
                    <div className="text-xs text-gray-500 mt-1">Role: {user?.role}</div>
                    <div className="text-xs text-gray-600 mt-3">
                      <span className="font-semibold text-gray-800">Districts:</span> {districtLabel}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold text-gray-800">Blocks:</span> {blockLabel}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
