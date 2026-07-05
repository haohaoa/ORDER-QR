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

export function setAuthToken(token: string, user: any) {
  localStorage.setItem('access_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth_user')
}

export function getAuthToken() {
  return localStorage.getItem('access_token')
}

export function getAuthUser() {
  const raw = localStorage.getItem('auth_user')
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
