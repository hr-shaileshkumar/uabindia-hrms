export const ROLE_ACCESS = {
  Admin: ['Dashboard', 'Team', 'Leave'],
  Department: ['Dashboard', 'Team', 'Leave'],
  MVU: ['Dashboard', 'Team', 'Leave'],
  FieldUser: ['Dashboard', 'Team', 'Leave']
}

export const ROLE_LABELS = {
  Admin: 'Admin',
  Department: 'Department Head',
  MVU: 'Manager',
  FieldUser: 'MVU Staff'
}

export const ROUTE_ACCESS = {
  dashboard: ['Admin', 'Department', 'MVU', 'FieldUser'],
  team: ['Admin', 'Department', 'MVU'],
  leave: ['Admin', 'Department', 'MVU', 'FieldUser'],
  users: ['Admin']
}

const STORAGE_KEY = 'roleAccessMap'

export const setStoredRoleAccess = (map) => {
  if (!map) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export const getStoredRoleAccess = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getRolePages = (role) => {
  const stored = getStoredRoleAccess()
  if (stored && stored[role]) {
    return stored[role]
  }
  return ROLE_ACCESS[role] ?? ['Dashboard']
}

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role

export const getUserPages = (user) => {
  if (user?.allowedPages?.length) {
    return user.allowedPages
  }
  return getRolePages(user?.role)
}

export const hasAccess = (user, page) => getUserPages(user).includes(page)
