import { API_BASE_URL } from './api'

function parseJwt(token: string | null) {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(decoded)))
  } catch (e) {
    return null
  }
}

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function setAuthToken(token: string, user: any) {
  if (!hasBrowserStorage()) return
  window.localStorage.setItem('access_token', token)
  window.localStorage.setItem('auth_user', JSON.stringify(user))
}

export function clearAuth() {
  if (!hasBrowserStorage()) return
  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem('auth_user')
}

export function getAuthToken() {
  if (!hasBrowserStorage()) return null
  return window.localStorage.getItem('access_token')
}

export function getAuthUser() {
  if (!hasBrowserStorage()) return null
  const raw = window.localStorage.getItem('auth_user')
  return raw ? JSON.parse(raw) : null
}

export function isTokenExpired(token?: string) {
  const t = token ?? getAuthToken()
  if (!t) return true
  const payload = parseJwt(t)
  if (!payload || !payload.exp) return true
  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Login failed')
  }
  const data = await res.json()
  setAuthToken(data.access_token, data.user)
  return data
}

export function getRole() {
  const user = getAuthUser()
  return user?.role
}

export function getUserRoleLabel(role?: string | null) {
  const normalizedRole = role?.toString().toLowerCase()

  if (['admin', 'manager'].includes(normalizedRole || '')) {
    return { label: 'Quản lý', badgeClass: 'bg-emerald-100 text-emerald-700' }
  }

  if (['service', 'kitchen', 'staff'].includes(normalizedRole || '')) {
    return { label: 'Nhân viên', badgeClass: 'bg-blue-100 text-blue-700' }
  }

  if (normalizedRole === 'customer') {
    return { label: 'Khách hàng', badgeClass: 'bg-slate-100 text-slate-700' }
  }

  return { label: 'Chưa phân vai trò', badgeClass: 'bg-gray-100 text-gray-700' }
}
