import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../utils/roles'

export default function RoleRedirect() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    if (loading) return

    if (!user) {
      hasRedirected.current = true
      navigate('/login', { replace: true })
      return
    }

    // Only redirect once we have a valid roles
    if (role) {
      hasRedirected.current = true
      if (role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/login', { replace: true }) // Fallback for roles that no longer exist or unauthorized roles
      }
    }
  }, [user, role, loading])

  return null
}
