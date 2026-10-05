import type { User } from "../types/auth"
import {getAccessToken} from "../utils/token"

export interface LoginRequest {
    email : string
    passowrd : string
}

export interface LoginResponse{
    message : string
    access_token : string
    token_type : string
}

const API_BASE_URL = 'http://127.0.0.1:8000'

export async function login(data : LoginRequest): 
    Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`,{
            method : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        if(!response.ok){
            throw new Error('Invalid email or password')
        }
        return response.json()
    }

export async function getCurrentUser(): Promise<User> {
  const token = getAccessToken()

  if (!token) {
    throw new Error('Access token not found')
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      method: 'GET',

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Unable to get current user')
  }

  return response.json()
}