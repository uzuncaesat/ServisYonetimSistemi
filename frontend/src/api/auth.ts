import api from './axios'

export interface LoginData {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

export interface User {
  id: number
  email: string
  full_name: string
  role: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    // OAuth2PasswordRequestForm expects URL-encoded form data
    const params = new URLSearchParams()
    params.append('username', data.username)
    params.append('password', data.password)
    
    const response = await api.post('/auth/login', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
}

