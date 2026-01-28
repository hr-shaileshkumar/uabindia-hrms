import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const Team = () => {
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks] = useState([])
  const [villages, setVillages] = useState([])
  const [filters, setFilters] = useState({
    districtId: null,
    blockId: null,
    villageId: null,
    startDate: null,
    endDate: null,
    feedbackStatus: ''
  })

  useEffect(() => {
    fetchDistricts()
    fetchTreatments()
  }, [])

  useEffect(() => {
    if (filters.districtId) {
      fetchBlocks(filters.districtId)
    } else {
      setBlocks([])
      setVillages([])
    }
  }, [filters.districtId])

  useEffect(() => {
    if (filters.blockId) {
      fetchVillages(filters.blockId)
    } else {
      setVillages([])
    }
  }, [filters.blockId])

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

  const fetchVillages = async (blockId) => {
    try {
      const response = await axios.get(`/api/locations/villages/${blockId}`)
      setVillages(response.data)
    } catch (error) {
      console.error('Error fetching villages:', error)
    }
  }

  const fetchTreatments = async () => {
    setLoading(true)
    try {
      const params = {
        districtId: filters.districtId || undefined,
        blockId: filters.blockId || undefined,
        villageId: filters.villageId || undefined,
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
        feedbackStatus: filters.feedbackStatus || undefined
      }

      const response = await axios.get('/api/treatments', { params })
      setTreatments(response.data)
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load treatments'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    fetchTreatments()
  }

  const handleResetFilters = () => {
    setFilters({
      districtId: null,
      blockId: null,
      villageId: null,
      startDate: null,
      endDate: null,
      feedbackStatus: ''
    })
    setTimeout(fetchTreatments, 100)
  }

  const exportColumns = [
    'Treatment Date',
    'Farmer Name',
    'Mobile',
    'District',
    'Block',
    'Village',
    'Animal Type',
    'Disease/Problem',
    'Treatment Details',
    'Medicine',
    'Feedback Status',
    'Created By'
  ]

  const exportData = treatments.map(t => ({
    'Treatment Date': new Date(t.treatmentDate).toLocaleDateString(),
    'Farmer Name': t.farmerName,
    'Mobile': t.farmerMobile,
    'District': t.districtName,
    'Block': t.blockName,
    'Village': t.villageName,
    'Animal Type': t.animalTypeName,
    'Disease/Problem': t.diseaseProblem,
    'Treatment Details': t.treatmentDetails || '',
    'Medicine': t.medicineName || '',
    'Feedback Status': t.feedbackStatus,
    'Created By': t.createdByUser
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
    a.download = `Team_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Team Report', 14, 12)

  const columns = exportColumns
  const rows = exportData.length > 0 ? exportData.map(item => columns.map(col => item[col])) : []

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 18,
      styles: { fontSize: 8 }
    })

    doc.save(`Team_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Team</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
            <select
              value={filters.villageId || ''}
              onChange={(e) => handleFilterChange('villageId', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!filters.blockId}
            >
              <option value="">All</option>
              {villages.map(v => (
                <option key={v.villageId} value={v.villageId}>{v.villageName}</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.feedbackStatus}
              onChange={(e) => handleFilterChange('feedbackStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="Recovered">Recovered</option>
              <option value="Improved">Improved</option>
              <option value="NotImproved">Not Improved</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Treatments Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disease</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {treatments.map(treatment => (
                  <tr key={treatment.treatmentId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(treatment.treatmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{treatment.farmerName}</div>
                      <div className="text-gray-500 text-xs">{treatment.farmerMobile}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{treatment.villageName}</div>
                      <div className="text-gray-500 text-xs">{treatment.blockName}, {treatment.districtName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {treatment.animalTypeName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {treatment.diseaseProblem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        treatment.feedbackStatus === 'Recovered' ? 'bg-green-100 text-green-800' :
                        treatment.feedbackStatus === 'Improved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {treatment.feedbackStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {treatment.beforeImageUrl && (
                          <a
                            href={treatment.beforeImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Before
                          </a>
                        )}
                        {treatment.afterImageUrl && (
                          <a
                            href={treatment.afterImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            After
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {treatments.length === 0 && (
            <div className="text-center py-8 text-gray-500">No treatments found</div>
          )}
        </div>
      )}
    </div>
  )
}

export default Team
