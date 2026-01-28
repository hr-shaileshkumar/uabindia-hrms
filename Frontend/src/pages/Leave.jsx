import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Leave = () => {
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks] = useState([])
  const [filters, setFilters] = useState({
    districtId: null,
    blockId: null,
    startDate: null,
    endDate: null
  })

  useEffect(() => {
    fetchDistricts()
    fetchFarmers()
  }, [])

  useEffect(() => {
    if (filters.districtId) {
      fetchBlocks(filters.districtId)
    } else {
      setBlocks([])
    }
  }, [filters.districtId])

  const fetchDistricts = async () => {
    try {
      const response = await axios.get('/api/locations/districts')
      setDistricts(response.data)
    } catch (error) {
      console.error('Error fetching districts:', error)
    }
  }

  const fetchBlocks = async (districtId) => {
    try {
      const response = await axios.get(`/api/locations/blocks/${districtId}`)
      setBlocks(response.data)
    } catch (error) {
      console.error('Error fetching blocks:', error)
    }
  }

  const fetchFarmers = async () => {
    setLoading(true)
    try {
      const params = {
        districtId: filters.districtId || undefined,
        blockId: filters.blockId || undefined,
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined
      }

      const response = await axios.get('/api/farmers', { params })
      setFarmers(response.data)
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load farmers'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchFarmers()
  }

  const handleResetFilters = () => {
    setFilters({
      districtId: null,
      blockId: null,
      startDate: null,
      endDate: null
    })
    setBlocks([])
    setTimeout(fetchFarmers, 100)
  }

  const exportColumns = [
    'Farmer Name',
    'Mobile',
    'District',
    'Block',
    'Village',
    'Created At'
  ]

  const exportData = farmers.map(f => ({
    'Farmer Name': f.farmerName,
    'Mobile': f.mobileNumber,
    'District': f.districtName,
    'Block': f.blockName,
    'Village': f.villageName,
    'Created At': new Date(f.createdAt).toLocaleDateString()
  }))

  const exportToCsv = () => {
    const cols = exportColumns
    const rows = exportData.map(item => cols.map(col => {
      const v = item[col] ?? ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
    }).join(','))
    const csv = [cols.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Leave_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Leave Report', 14, 12)

  const columns = exportColumns
  const rows = exportData.length > 0 ? exportData.map(item => columns.map(col => item[col])) : []

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 18,
      styles: { fontSize: 9 }
    })

    doc.save(`Leave_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Leave</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCsv}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPdf}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              value={filters.districtId || ''}
              onChange={(e) => handleFilterChange('districtId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              {districts.map(d => (
                <option key={d.districtId} value={d.districtId}>{d.districtName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
            <select
              value={filters.blockId || ''}
              onChange={(e) => handleFilterChange('blockId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!filters.districtId}
            >
              <option value="">All</option>
              {blocks.map(b => (
                <option key={b.blockId} value={b.blockId}>{b.blockName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              dateFormat="yyyy-MM-dd"
              placeholderText="Start date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              dateFormat="yyyy-MM-dd"
              placeholderText="End date"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Apply Filters
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Farmers Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Village</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {farmers.map(farmer => (
                  <tr key={farmer.farmerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {farmer.farmerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.mobileNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.districtName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.blockName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {farmer.villageName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(farmer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {farmers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No farmers found</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Leave
