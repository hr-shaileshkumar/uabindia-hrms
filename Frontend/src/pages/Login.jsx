import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../services/authApi'
import logo from '../assets/logo.png'

const Login = () => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [login, { isLoading }] = useLoginMutation()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!userId || !password) {
      setError('Please enter your user ID and password.')
      return
    }

    try {
      const res = await login({ userId, password }).unwrap()
      // expected backend: { accessToken, refreshToken, user }
      const { accessToken, refreshToken, user } = res
      if (accessToken) {
        localStorage.setItem('token', accessToken)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
        localStorage.setItem('user', JSON.stringify(user || {}))
        if (rememberMe) localStorage.setItem('rememberedUserId', userId)
        else localStorage.removeItem('rememberedUserId')
        navigate('/')
      } else {
        setError(res.message || 'Login failed')
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="w-full max-w-md">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <img src={logo} alt="UabIndia Hrms" className="mx-auto h-14 w-auto object-contain mb-4" />
            <h1 className="text-2xl font-semibold text-slate-900 text-center">UabIndia HRMS</h1>
            <p className="text-sm text-slate-600 text-center mt-1">Enterprise Human Resource Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="login form">
            <div>
              <label htmlFor="login-userid" className="block text-sm font-medium text-slate-700 mb-1">User ID / Email / Mobile</label>
              <input
                id="login-userid"
                name="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Enter your user ID, email or mobile"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm text-teal-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">This is a secure system. Unauthorized access is prohibited.</p>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Remember this device
              </label>

              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">Forgot Password?</a>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="w-full mt-6 bg-teal-700 text-white py-2.5 rounded-md font-medium hover:bg-teal-800 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-5">© 2026 UabIndia HRMS. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
