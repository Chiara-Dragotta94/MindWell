// In produzione (es. GitHub Pages) imposto questa variabile nel file .env.production.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

export function getToken() {
  return window.localStorage.getItem('token')
}

export function setToken(token) {
  if (token) window.localStorage.setItem('token', token)
  else window.localStorage.removeItem('token')
}

export async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Errore nella richiesta')
  return data
}
