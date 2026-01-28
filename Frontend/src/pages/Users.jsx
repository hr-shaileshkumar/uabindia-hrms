import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getRoleLabel, getRolePages, getUserPages, setStoredRoleAccess } from '../utils/roleAccess'

const Users = () => {
  const [users, setUsers] = useState([])
  const [districts, setDistricts] = useState([])
  const [blocksByDistrict, setBlocksByDistrict] = useState({})
  const [editBlocksByDistrict, setEditBlocksByDistrict] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [roleAccessMap, setRoleAccessMap] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({
    userName: '',
    fullName: '',
    mobileNumber: '',
    role: 'Department',
    password: '',
    districtIds: [],
    blockIds: []
  })
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobileNumber: '',
    role: 'Department',
    districtIds: [],
    blockIds: [],
    allowedPages: []
  })
  const [accessForm, setAccessForm] = useState({
    userId: '',
    allowedPages: []
  })

  const pageOptions = ['Dashboard', 'Team', 'Leave', 'Users']
  const activeSection = useMemo(() => searchParams.get('section') || 'create', [searchParams])

  const setSection = (section) => {
    setSearchParams({ section })
  }

  useEffect(() => {
    if (activeSection === 'role-access') {
      fetchRoleAccess()
      return
    }

    fetchUsers()

    if (activeSection === 'create') {
      fetchDistricts()
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection !== 'create') return
    if (form.districtIds.length === 0) {
      setBlocksByDistrict({})
      setForm(prev => ({ ...prev, blockIds: [] }))
      return
    }

    fetchBlocksForDistricts(form.districtIds).then(setBlocksByDistrict)
  }, [form.districtIds, activeSection])

  useEffect(() => {
    if (!showEditModal) return
    if (editForm.districtIds.length === 0) {
      setEditBlocksByDistrict({})
      setEditForm(prev => ({ ...prev, blockIds: [] }))
      return
    }

    fetchBlocksForDistricts(editForm.districtIds).then(setEditBlocksByDistrict)
  }, [editForm.districtIds, showEditModal])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data)
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load users' })
    } finally {
      setLoading(false)
    }
  }

  const fetchDistricts = async () => {
    try {
      const response = await axios.get('/api/locations/districts')
      setDistricts(response.data || [])
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load districts' })
    }
  }

  const fetchBlocksForDistricts = async (districtIds) => {
    const map = {}
    await Promise.all(
      districtIds.map(async (districtId) => {
        try {
          const response = await axios.get(`/api/locations/blocks/${districtId}`)
          map[districtId] = response.data || []
        } catch {
          map[districtId] = []
        }
      })
    )
    return map
  }

  const fetchRoleAccess = async () => {
    try {
      const response = await axios.get('/api/role-access')
      setRoleAccessMap(response.data || {})
      setStoredRoleAccess(response.data || {})
    } catch (error) {
      // ignore for non-admin
    }
  }

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleDistrictToggle = (districtId) => {
    setForm(prev => {
      const exists = prev.districtIds.includes(districtId)
      let nextBlockIds = prev.blockIds
      if (exists) {
        const blocksToRemove = (blocksByDistrict[districtId] || []).map(b => b.blockId)
        if (blocksToRemove.length > 0) {
          nextBlockIds = prev.blockIds.filter(id => !blocksToRemove.includes(id))
        }
      }
      return {
        ...prev,
        districtIds: exists
          ? prev.districtIds.filter(id => id !== districtId)
          : [...prev.districtIds, districtId],
        blockIds: nextBlockIds
      }
    })
  }

  const handleSelectAllDistricts = () => {
    setForm(prev => {
      if (districts.length === 0) {
        return prev
      }

      const allIds = districts.map(d => d.districtId)
      const isAllSelected = prev.districtIds.length === allIds.length
      return {
        ...prev,
        districtIds: isAllSelected ? [] : allIds,
        blockIds: isAllSelected ? [] : prev.blockIds
      }
    })
  }

  const getVisibleBlockIds = (districtIds, map) => {
    return districtIds.flatMap(districtId => (map[districtId] || []).map(block => block.blockId))
  }

  const areAllBlocksSelected = (districtIds, blockIds, map) => {
    const visibleBlockIds = getVisibleBlockIds(districtIds, map)
    return visibleBlockIds.length > 0 && visibleBlockIds.every(id => blockIds.includes(id))
  }

  const handleSelectAllBlocks = () => {
    setForm(prev => {
      const visibleBlockIds = getVisibleBlockIds(prev.districtIds, blocksByDistrict)
      if (visibleBlockIds.length === 0) {
        return prev
      }
      const isAllSelected = visibleBlockIds.every(id => prev.blockIds.includes(id))
      return {
        ...prev,
        blockIds: isAllSelected
          ? prev.blockIds.filter(id => !visibleBlockIds.includes(id))
          : [...new Set([...prev.blockIds, ...visibleBlockIds])]
      }
    })
  }

  const handleBlockToggle = (blockId) => {
    setForm(prev => {
      const exists = prev.blockIds.includes(blockId)
      return {
        ...prev,
        blockIds: exists
          ? prev.blockIds.filter(id => id !== blockId)
          : [...prev.blockIds, blockId]
      }
    })
  }

  const handleAccessPageToggle = (pageName) => {
    setAccessForm(prev => {
      const exists = prev.allowedPages.includes(pageName)
      return {
        ...prev,
        allowedPages: exists
          ? prev.allowedPages.filter(page => page !== pageName)
          : [...prev.allowedPages, pageName]
      }
    })
  }

  const handleAccessUserChange = (userId) => {
    const selectedUser = users.find(u => u.userId === Number(userId))
    setAccessForm({
      userId,
      allowedPages: selectedUser?.allowedPages ?? []
    })
  }

  const handleAccessSubmit = async (e) => {
    e.preventDefault()

    if (!accessForm.userId) {
      Swal.fire({ icon: 'error', title: 'Select User', text: 'Please select a user' })
      return
    }

    try {
      await axios.put(`/api/users/${accessForm.userId}/access-pages`, {
        allowedPages: accessForm.allowedPages
      })
      Swal.fire({ icon: 'success', title: 'Updated', text: 'User access updated' })
      fetchUsers()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update access' })
    }
  }

  const handleRoleAccessToggle = (role, pageName) => {
    setRoleAccessMap(prev => {
      const rolePages = prev[role] || []
      const exists = rolePages.includes(pageName)
      const updatedPages = exists
        ? rolePages.filter(page => page !== pageName)
        : [...rolePages, pageName]
      return { ...prev, [role]: updatedPages }
    })
  }

  const handleRoleAccessSave = async (role) => {
    try {
      const pages = roleAccessMap[role] || []
      const response = await axios.put(`/api/role-access/${role}`, { pages })
      const updatedMap = { ...roleAccessMap, [role]: response.data || pages }
      setRoleAccessMap(updatedMap)
      setStoredRoleAccess(updatedMap)
      Swal.fire({ icon: 'success', title: 'Updated', text: `Access updated for ${role}` })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update access' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.userName || !form.fullName || !form.mobileNumber || !form.role) {
      Swal.fire({ icon: 'error', title: 'Missing Details', text: 'Please fill all required fields' })
      return
    }

    try {
      await axios.post('/api/users', {
        userName: form.userName.trim(),
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        role: form.role,
        password: form.password || null,
        districtIds: form.districtIds,
        blockIds: form.blockIds
      })

      Swal.fire({ icon: 'success', title: 'User Created', text: 'User added successfully' })
      setForm({
        userName: '',
        fullName: '',
        mobileNumber: '',
        role: 'Department',
        password: '',
        districtIds: [],
        blockIds: []
      })
      fetchUsers()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to create user' })
    }
  }

  const openEditModal = async (user) => {
    // Fetch districts if not already loaded
    if (districts.length === 0) {
      await fetchDistricts()
    }

    // Get district IDs from district names
    const districtIds = user.districts
      .map(name => districts.find(d => d.districtName === name)?.districtId)
      .filter(id => id !== undefined)

    const blocksMap = districtIds.length > 0
      ? await fetchBlocksForDistricts(districtIds)
      : {}
    setEditBlocksByDistrict(blocksMap)

    const blockIds = (user.blocks || [])
      .map(name => Object.values(blocksMap).flat().find(b => b.blockName === name)?.blockId)
      .filter(id => id !== undefined)

    setEditingUser(user)
    setEditForm({
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      districtIds,
      blockIds,
      allowedPages: user.allowedPages || []
    })
    setShowEditModal(true)
  }

  const handleEditChange = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const handleEditDistrictToggle = (districtId) => {
    setEditForm(prev => {
      const exists = prev.districtIds.includes(districtId)
      let nextBlockIds = prev.blockIds
      if (exists) {
        const blocksToRemove = (editBlocksByDistrict[districtId] || []).map(b => b.blockId)
        if (blocksToRemove.length > 0) {
          nextBlockIds = prev.blockIds.filter(id => !blocksToRemove.includes(id))
        }
      }
      return {
        ...prev,
        districtIds: exists
          ? prev.districtIds.filter(id => id !== districtId)
          : [...prev.districtIds, districtId],
        blockIds: nextBlockIds
      }
    })
  }

  const handleEditSelectAllDistricts = () => {
    setEditForm(prev => {
      if (districts.length === 0) {
        return prev
      }

      const allIds = districts.map(d => d.districtId)
      const isAllSelected = prev.districtIds.length === allIds.length
      return {
        ...prev,
        districtIds: isAllSelected ? [] : allIds,
        blockIds: isAllSelected ? [] : prev.blockIds
      }
    })
  }

  const handleEditSelectAllBlocks = () => {
    setEditForm(prev => {
      const visibleBlockIds = getVisibleBlockIds(prev.districtIds, editBlocksByDistrict)
      if (visibleBlockIds.length === 0) {
        return prev
      }
      const isAllSelected = visibleBlockIds.every(id => prev.blockIds.includes(id))
      return {
        ...prev,
        blockIds: isAllSelected
          ? prev.blockIds.filter(id => !visibleBlockIds.includes(id))
          : [...new Set([...prev.blockIds, ...visibleBlockIds])]
      }
    })
  }

  const handleEditBlockToggle = (blockId) => {
    setEditForm(prev => {
      const exists = prev.blockIds.includes(blockId)
      return {
        ...prev,
        blockIds: exists
          ? prev.blockIds.filter(id => id !== blockId)
          : [...prev.blockIds, blockId]
      }
    })
  }

  const handleEditPageToggle = (pageName) => {
    setEditForm(prev => {
      const exists = prev.allowedPages.includes(pageName)
      return {
        ...prev,
        allowedPages: exists
          ? prev.allowedPages.filter(page => page !== pageName)
          : [...prev.allowedPages, pageName]
      }
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editForm.fullName || !editForm.mobileNumber || !editForm.role) {
      Swal.fire({ icon: 'error', title: 'Missing Details', text: 'Please fill all required fields' })
      return
    }

    try {
      await axios.put(`/api/users/${editingUser.userId}`, {
        fullName: editForm.fullName.trim(),
        mobileNumber: editForm.mobileNumber.trim(),
        role: editForm.role,
        districtIds: editForm.districtIds,
        blockIds: editForm.blockIds,
        allowedPages: editForm.allowedPages
      })

      Swal.fire({ icon: 'success', title: 'Updated', text: 'User updated successfully' })
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update user' })
    }
  }

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/users/${user.userId}`)
        Swal.fire({ icon: 'success', title: 'Deleted', text: 'User deleted successfully' })
        fetchUsers()
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to delete user' })
      }
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Users</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSection('create')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeSection === 'create'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Create User
          </button>
          <button
            onClick={() => setSection('role-access')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeSection === 'role-access'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Role Access
          </button>
          <button
            onClick={() => setSection('access')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeSection === 'access'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            User Access
          </button>
          <button
            onClick={() => setSection('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeSection === 'list'
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            User List
          </button>
        </div>
      </div>

      {activeSection === 'create' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Create User</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={form.userName}
              onChange={(e) => handleChange('userName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter user ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="10-digit mobile"
              maxLength={10}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Admin">Admin</option>
              <option value="Department">Department Head</option>
              <option value="MVU">Manager</option>
              <option value="FieldUser">MVU Staff</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Role default: {getRolePages(form.role).join(', ')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Set login password"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Districts</label>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={districts.length > 0 && form.districtIds.length === districts.length}
                onChange={handleSelectAllDistricts}
              />
              <span>Select All Districts</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {districts.map(district => (
                <label key={district.districtId} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.districtIds.includes(district.districtId)}
                    onChange={() => handleDistrictToggle(district.districtId)}
                  />
                  <span>{district.districtName}</span>
                </label>
              ))}
              {districts.length === 0 && (
                <span className="text-sm text-gray-400">No districts available</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select multiple districts as needed.</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Blocks</label>
            {form.districtIds.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={areAllBlocksSelected(form.districtIds, form.blockIds, blocksByDistrict)}
                  onChange={handleSelectAllBlocks}
                />
                <span>Select All Blocks</span>
              </label>
            )}
            {form.districtIds.length === 0 ? (
              <p className="text-xs text-gray-500">Select district to load blocks.</p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {form.districtIds.map(districtId => (
                  <div key={districtId}>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      {districts.find(d => d.districtId === districtId)?.districtName}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {(blocksByDistrict[districtId] || []).map(block => (
                        <label key={block.blockId} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={form.blockIds.includes(block.blockId)}
                            onChange={() => handleBlockToggle(block.blockId)}
                          />
                          <span>{block.blockName}</span>
                        </label>
                      ))}
                      {(blocksByDistrict[districtId] || []).length === 0 && (
                        <span className="text-xs text-gray-400">No blocks</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Blocks are limited to selected districts.</p>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add User
            </button>
          </div>
          </form>
        </div>
      )}

      {activeSection === 'access' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Update User Access Pages</h2>
          <form onSubmit={handleAccessSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              value={accessForm.userId}
              onChange={(e) => handleAccessUserChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName} ({user.userName})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave access empty to use role default.</p>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Pages Override</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-200 rounded-lg p-3">
              {pageOptions.map(page => (
                <label key={page} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={accessForm.allowedPages.includes(page)}
                    onChange={() => handleAccessPageToggle(page)}
                  />
                  <span>{page}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Access
            </button>
          </div>
          </form>
        </div>
      )}

      {activeSection === 'role-access' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Role Access Mapping</h2>
          <div className="space-y-4">
            {['Admin', 'Department', 'MVU', 'FieldUser'].map(role => (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{getRoleLabel(role)}</h3>
                  <button
                    type="button"
                    onClick={() => handleRoleAccessSave(role)}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {pageOptions.map(page => (
                    <label key={`${role}-${page}`} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={(roleAccessMap[role] || []).includes(page)}
                        onChange={() => handleRoleAccessToggle(role, page)}
                      />
                      <span>{page}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Choose pages for the {getRoleLabel(role)} role.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Districts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blocks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.userId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.mobileNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRoleLabel(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getUserPages(user).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.districts?.length
                      ? user.districts.join(', ')
                      : (user.role === 'Admin' || user.role === 'Department' ? 'All' : 'Not mapped')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.blocks?.length
                      ? user.blocks.join(', ')
                      : (user.role === 'Admin' || user.role === 'Department' ? 'All' : 'Not mapped')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && users.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found</div>
        )}
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit User - {editingUser.userName}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => handleEditChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={editForm.mobileNumber}
                      onChange={(e) => handleEditChange('mobileNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => handleEditChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Admin">Admin</option>
                      <option value="Department">Department Head</option>
                      <option value="MVU">Manager</option>
                      <option value="FieldUser">MVU Staff</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Districts</label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={districts.length > 0 && editForm.districtIds.length === districts.length}
                      onChange={handleEditSelectAllDistricts}
                    />
                    <span>Select All Districts</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {districts.map(district => (
                      <label key={district.districtId} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editForm.districtIds.includes(district.districtId)}
                          onChange={() => handleEditDistrictToggle(district.districtId)}
                        />
                        <span>{district.districtName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Blocks</label>
                  {editForm.districtIds.length > 0 && (
                    <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={areAllBlocksSelected(editForm.districtIds, editForm.blockIds, editBlocksByDistrict)}
                        onChange={handleEditSelectAllBlocks}
                      />
                      <span>Select All Blocks</span>
                    </label>
                  )}
                  {editForm.districtIds.length === 0 ? (
                    <p className="text-xs text-gray-500">Select district to load blocks.</p>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {editForm.districtIds.map(districtId => (
                        <div key={districtId}>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            {districts.find(d => d.districtId === districtId)?.districtName}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {(editBlocksByDistrict[districtId] || []).map(block => (
                              <label key={block.blockId} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editForm.blockIds.includes(block.blockId)}
                                  onChange={() => handleEditBlockToggle(block.blockId)}
                                />
                                <span>{block.blockName}</span>
                              </label>
                            ))}
                            {(editBlocksByDistrict[districtId] || []).length === 0 && (
                              <span className="text-xs text-gray-400">No blocks</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Blocks are limited to selected districts.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Pages</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {pageOptions.map(page => (
                      <label key={page} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editForm.allowedPages.includes(page)}
                          onChange={() => handleEditPageToggle(page)}
                        />
                        <span>{page}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Leave empty to use role defaults</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
