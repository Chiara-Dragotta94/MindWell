import { apiRequest, setToken, getToken } from './api.js'

const USER_KEY = 'user'

export function getCurrentUser() {
  try { return JSON.parse(window.localStorage.getItem(USER_KEY)) } catch { return null }
}

export function saveAuth(user, token) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  setToken(token)
}

export function logout() {
  setToken(null)
  window.localStorage.removeItem(USER_KEY)
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
