export const ROLE_ACCESS = {
  Admin: ['Dashboard'],
  Department: ['Dashboard'],
  MVU: ['Dashboard'],
  FieldUser: ['Dashboard']
}

export const ROLE_LABELS = {
  Admin: 'Admin',
  Department: 'Department Head',
  MVU: 'Manager',
  FieldUser: 'MVU Staff'
}

export const getRolePages = (role) => ROLE_ACCESS[role] ?? ['Dashboard']

export const getUserPages = (user) => {
  if (user?.allowedPages?.length) {
    return user.allowedPages
  }
  return getRolePages(user?.role)
}

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role

export const hasAccess = (user, page) => getUserPages(user).includes(page)
