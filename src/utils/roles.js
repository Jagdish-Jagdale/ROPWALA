export const ROLES = {
  ADMIN: 'admin',
}

export const hasAnyRole = (role, allowed = []) => allowed.includes(role)
