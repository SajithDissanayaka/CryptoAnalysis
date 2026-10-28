import { getAccessToken, removeAccessToken } from '../utils/token'

const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  timeout = 20000,
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json')
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(timeout)])
    : AbortSignal.timeout(timeout)
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('This request is taking too long. Please retry.')
    }
    throw new ApiError('Cannot reach CryptoMind. Check that the backend is running, then retry.')
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith('/auth/login')) {
      removeAccessToken()
      window.dispatchEvent(new Event('auth:expired'))
    }
    const detail = data?.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg?: string }) => item.msg || 'Invalid input').join('. ')
          : `Request failed (${response.status}). Please retry.`
    throw new ApiError(message, response.status)
  }
  if (data === null) throw new ApiError('The server returned an unreadable response. Please retry.')
  return data as T
}
