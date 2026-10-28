import type { User } from '../types/auth'
import { request } from './client'

export interface LoginRequest {
  email: string
  password: string
}
export interface LoginResponse {
  message: string
  access_token: string
  token_type: string
}

export const login = (data: LoginRequest) =>
  request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) })
export const register = (data: LoginRequest & { username: string }) =>
  request<User>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
export const getCurrentUser = (signal?: AbortSignal) => request<User>('/auth/me', { signal })
