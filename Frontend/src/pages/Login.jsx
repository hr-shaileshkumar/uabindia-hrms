import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import logo from '../assets/logo.png'

const Login = () => {
  const [loginType, setLoginType] = useState('department') // department | mvu
  const [mobileNumber, setMobileNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState(1) // 1: Enter mobile, 2: Enter OTP
  const [adminMode, setAdminMode] = useState('login') // login | change | reset
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetMobile, setResetMobile] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [resetStep, setResetStep] = useState(1)
  const { generateOtp, verifyOtp, loginWithPassword, changePassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedUserId = localStorage.getItem('rememberedUserId')
    const savedPassword = localStorage.getItem('rememberedPassword')
    if (savedUserId) {
      setUserId(savedUserId)
      setRememberMe(true)
    }
    if (savedPassword) {
      setPassword(savedPassword)
    }
  }, [])

  useEffect(() => {
    if (!rememberMe) {
      return
    }

    if (userId) {
      localStorage.setItem('rememberedUserId', userId)
    }

    if (password) {
      localStorage.setItem('rememberedPassword', password)
    }
  }, [rememberMe, userId, password])

  const handleGenerateOTP = async (e) => {
    e.preventDefault()
    
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Mobile Number',
        text: 'Please enter a valid 10-digit mobile number'
      })
      return
    }

    try {
      const response = await generateOtp(mobileNumber)

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent',
          text: `OTP: ${response.otpCode} (Development Mode)`,
          timer: 5000
        })
        setStep(2)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate OTP'
      })
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()

    try {
      const result = await verifyOtp(mobileNumber, otpCode)

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          timer: 1500,
          showConfirmButton: false
        })
        navigate('/')
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid OTP'
      })
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()

    if (!userId || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Credentials',
        text: 'Please enter user ID and password'
      })
      return
    }

    try {
      const result = await loginWithPassword(userId, password)

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedUserId', userId)
          localStorage.setItem('rememberedPassword', password)
        } else {
          localStorage.removeItem('rememberedUserId')
          localStorage.removeItem('rememberedPassword')
        }
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          timer: 1500,
          showConfirmButton: false
        })
        navigate('/')
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || error.message || 'Invalid credentials'
      })
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!userId || !currentPassword || !newPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Details',
        text: 'Please fill all fields to change password'
      })
      return
    }

    try {
      const response = await changePassword(userId, currentPassword, newPassword)
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Updated',
          text: response.message
        })
        setAdminMode('login')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to change password'
      })
    }
  }

  const handleSendResetOtp = async () => {
    if (!userId || !resetMobile) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Details',
        text: 'Enter user ID and mobile number'
      })
      return
    }

  if (resetMobile.length !== 10 || !/^\d+$/.test(resetMobile)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Mobile Number',
        text: 'Please enter a valid 10-digit mobile number'
      })
      return
    }

    try {
      const response = await generateOtp(resetMobile)
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent',
          text: `OTP: ${response.otpCode} (Development Mode)`
        })
        setResetStep(2)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to generate OTP'
      })
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!userId || !resetMobile || !resetOtp || !newPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Details',
        text: 'Please fill all fields to reset password'
      })
      return
    }

    try {
      const response = await resetPassword(userId, resetMobile, resetOtp, newPassword)
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          text: response.message
        })
        setAdminMode('login')
        setResetStep(1)
        setResetOtp('')
        setResetMobile('')
        setNewPassword('')
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to reset password'
      })
    }
  }

  const handleRememberToggle = () => {
    const nextValue = !rememberMe
    setRememberMe(nextValue)
    if (!nextValue) {
      localStorage.removeItem('rememberedUserId')
      localStorage.removeItem('rememberedPassword')
    } else {
      if (userId) {
        localStorage.setItem('rememberedUserId', userId)
      }
      if (password) {
        localStorage.setItem('rememberedPassword', password)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4 py-8">
      <div className="relative w-full max-w-lg">
  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-green-50 via-white to-white" aria-hidden="true" />

  <div className="relative bg-white border border-green-100 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-16 w-28 sm:h-16 sm:w-32 md:h-20 md:w-36 flex items-center justify-center rounded-xl bg-white">
              <img
                src={logo}
                alt="UABIndia Hrms"
                className="h-12 w-20 sm:h-12 sm:w-24 md:h-16 md:w-28 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-green-600 mb-1 leading-tight">UABIndia Hrms</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {loginType === 'admin' && 'Admin Dashboard'}
              {loginType === 'department' && 'Admin / Department Head / Manager Login'}
              {loginType === 'mvu' && 'MVU Staff Login'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginType('department')
                setAdminMode('login')
                setStep(1)
              }}
              className={`rounded-xl border px-3 py-2 transition ${loginType === 'department' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200' : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:text-green-700'}`}
            >
              Department
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('mvu')
                setStep(1)
              }}
              className={`rounded-xl border px-3 py-2 transition ${loginType === 'mvu' ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-200' : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:text-green-700'}`}
            >
              MVU
            </button>
          </div>

          {loginType === 'mvu' ? (
            step === 1 ? (
              <form onSubmit={handleGenerateOTP} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                >
                  Generate OTP
                </button>
                <p className="text-xs text-gray-500 text-center">OTP will be valid for a short time. Keep this page open.</p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Enter OTP</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm tracking-widest text-center"
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-semibold border border-gray-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                  >
                    Verify OTP
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center">Didn’t receive it? Re-generate from previous step.</p>
              </form>
            )
          ) : (
            <div className="space-y-6">
              {adminMode === 'login' && (
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">User ID</label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter user ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm pr-12"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-green-600 hover:text-green-700"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberToggle}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                  >
                    Login
                  </button>
                  <p className="text-xs text-gray-500 text-center">First time? Use reset password with OTP to set your password.</p>
                </form>
              )}

              {adminMode === 'change' && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">User ID</label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter user ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                  >
                    Update Password
                  </button>
                </form>
              )}

              {adminMode === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">User ID</label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter user ID"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      value={resetMobile}
                      onChange={(e) => setResetMobile(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      placeholder="Enter registered mobile number"
                      maxLength={10}
                      required
                    />
                  </div>

                  {resetStep === 2 && (
                    <>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">OTP</label>
                        <input
                          type="text"
                          value={resetOtp}
                          onChange={(e) => setResetOtp(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm text-center tracking-widest"
                          placeholder="Enter OTP"
                          maxLength={6}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                    </>
                  )}

                  {resetStep === 1 ? (
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                    >
                      Send OTP
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow-lg shadow-green-200"
                    >
                      Reset Password
                    </button>
                  )}
                </form>
              )}

              <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-green-700">
                {['login', 'change', 'reset'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setAdminMode(mode)
                      setResetStep(1)
                    }}
                    className={`transition hover:text-green-800 ${adminMode === mode ? 'underline' : 'text-green-700/80'}`}
                  >
                    {mode === 'login' && 'Login'}
                    {mode === 'change' && 'Change Password'}
                    {mode === 'reset' && 'Reset Password'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
