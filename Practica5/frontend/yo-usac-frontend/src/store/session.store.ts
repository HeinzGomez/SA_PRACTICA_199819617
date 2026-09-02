const ACCESS_TOKEN_KEY = 'yo_usac_access_token'
const USER_ID_KEY = 'yo_usac_user_id'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getUserId(): number | null {
  const raw = localStorage.getItem(USER_ID_KEY)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
}

export function setUserId(id: number): void {
  localStorage.setItem(USER_ID_KEY, String(id))
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}