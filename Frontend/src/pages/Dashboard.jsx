import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { hasAccess } from '../utils/roleAccess'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTreatments: 0,
    totalFarmers: 0,
    recovered: 0,
    improved: 0,
    notImproved: 0,
    totalDistricts: 0,
    totalBlocks: 0
  })
  const [districts, setDistricts] = useState([])
  const [selectedDistrictId, setSelectedDistrictId] = useState('')
  const [appliedDistrictId, setAppliedDistrictId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTodayOnly, setShowTodayOnly] = useState(true)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      fetchDistricts()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats(appliedDistrictId)
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [appliedDistrictId, showTodayOnly, authLoading, user])

  const parseLocalDate = (value) => {
    if (!value) {
      return null
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`)
    }
    return new Date(value)
  }

  const isToday = (value) => {
    const date = parseLocalDate(value)
    if (!date || Number.isNaN(date.getTime())) {
      return false
    }
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const fetchDistricts = async () => {
    try {
      const response = await axios.get('/api/locations/districts')
      setDistricts(response.data || [])
    } catch (error) {
      // ignore
    }
  }

  const fetchStats = async (districtId) => {
    const params = districtId ? { districtId } : undefined

    try {
      const [treatmentsRes, farmersRes, districtsRes] = await Promise.all([
        axios.get('/api/treatments', { params }),
        axios.get('/api/farmers', { params }),
        axios.get('/api/locations/districts')
      ])

      const allTreatments = treatmentsRes.data || []
      const allFarmers = farmersRes.data || []
      const treatments = showTodayOnly
        ? allTreatments.filter(t => isToday(t.treatmentDate))
        : allTreatments
      const farmers = showTodayOnly
        ? allFarmers.filter(f => isToday(f.createdAt))
        : allFarmers
      const allDistricts = districtsRes.data || []
      const displayDistricts = districtId
        ? allDistricts.filter(d => d.districtId === districtId)
        : allDistricts

      let totalBlocks = 0
      if (displayDistricts.length > 0) {
        const blockRequests = displayDistricts.map(d =>
          axios.get(`/api/locations/blocks/${d.districtId}`)
        )
        const blockResponses = await Promise.all(blockRequests)
        totalBlocks = blockResponses.reduce((sum, res) => sum + res.data.length, 0)
      }

      setStats({
        totalTreatments: treatments.length,
        totalFarmers: farmers.length,
        recovered: treatments.filter(t => t.feedbackStatus === 'Recovered').length,
        improved: treatments.filter(t => t.feedbackStatus === 'Improved').length,
        notImproved: treatments.filter(t => t.feedbackStatus === 'NotImproved').length,
        totalDistricts: displayDistricts.length,
        totalBlocks
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load dashboard statistics'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const canFilterDistrict = user?.role === 'Admin' || user?.role === 'Department' || user?.role === 'MVU'

  const handleApplyFilter = () => {
    const value = selectedDistrictId ? Number(selectedDistrictId) : null
    setAppliedDistrictId(value)
  }

  const handleResetFilter = () => {
    setSelectedDistrictId('')
    setAppliedDistrictId(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showTodayOnly}
              onChange={(e) => setShowTodayOnly(e.target.checked)}
              className="h-4 w-4 accent-green-600"
            />
            Today only
          </label>
        </div>
        {canFilterDistrict && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by District</label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Districts</option>
                {districts.map(d => (
                  <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleApplyFilter}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
          </div>
        )}
      </div>


      <div className="flex flex-nowrap gap-4 mb-6 overflow-x-auto pb-2">
        <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-emerald-500">
          <h3 className="text-gray-600 text-xs font-medium mb-1">Districts</h3>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalDistricts}</p>
        </div>
        <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-green-500">
          <h3 className="text-gray-600 text-xs font-medium mb-1">Blocks</h3>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalBlocks}</p>
        </div>
          <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-xs font-medium mb-1">Total Team</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalTreatments}</p>
          </div>
          <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-indigo-500">
            <h3 className="text-gray-600 text-xs font-medium mb-1">Total Leave</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalFarmers}</p>
          </div>
        <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-teal-500">
          <h3 className="text-gray-600 text-xs font-medium mb-1">Recovered</h3>
          <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
        </div>
        <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-amber-500">
          <h3 className="text-gray-600 text-xs font-medium mb-1">Improved</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.improved}</p>
        </div>
        <div className="bg-white px-4 py-4 rounded-lg shadow-sm w-44 border-l-4 border-red-500">
          <h3 className="text-gray-600 text-xs font-medium mb-1">Not Improved</h3>
          <p className="text-2xl font-bold text-red-600">{stats.notImproved}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome to UABIndia Hrms Admin Dashboard</h2>
        <p className="text-gray-600 mb-6">
          Choose a module below to manage data. Navigation links are available only on this dashboard.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
            {user && hasAccess(user, 'Team') && (
              <button
                onClick={() => navigate('/team')}
                className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-4 text-left shadow-sm hover:bg-green-100 transition"
              >
                <div>
                  <div className="text-lg font-semibold text-green-700">Team</div>
                  <div className="text-sm text-gray-600">View and filter treatment records</div>
                </div>
                <span className="text-green-600 font-semibold">Open →</span>
              </button>
            )}
            {user && hasAccess(user, 'Leave') && (
              <button
                onClick={() => navigate('/leave')}
                className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-4 text-left shadow-sm hover:bg-green-100 transition"
              >
                <div>
                  <div className="text-lg font-semibold text-green-700">Leave</div>
                  <div className="text-sm text-gray-600">Manage leave records</div>
                </div>
                <span className="text-green-600 font-semibold">Open →</span>
              </button>
            )}
          {user && hasAccess(user, 'Users') && (
            <button
              onClick={() => navigate('/users')}
              className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50 px-4 py-4 text-left shadow-sm hover:bg-green-100 transition"
            >
              <div>
                <div className="text-lg font-semibold text-green-700">Users</div>
                <div className="text-sm text-gray-600">Add department head and manager users</div>
              </div>
              <span className="text-green-600 font-semibold">Open →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
