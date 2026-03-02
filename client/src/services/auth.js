import { apiRequest, setToken, getToken } from './api.js'

const USER_KEY = 'user'

export function getCurrentUser() {
  try { return JSON.parse(window.localStorage.getItem(USER_KEY)) } catch { return null }
}

export function saveAuth(user, token) {
  // Salvo user+token in locale per mantenere la sessione tra refresh.
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  setToken(token)
}

export async function logout() {
  // Provo prima a notificare il logout al backend, poi chiudo sempre la sessione locale.
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } catch {
    // Anche se la chiamata API fallisce, chiudo comunque la sessione locale.
  } finally {
    setToken(null)
    window.localStorage.removeItem(USER_KEY)
  }
}

export async function register(payload) {
  const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
  saveAuth(data.user, data.token)
  return data.user
}

export async function login(payload) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  saveAuth(data.user, data.token)
  return data.user
}

export function isAuthenticated() {
  return !!getToken()
}
