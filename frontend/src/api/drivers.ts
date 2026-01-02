import api from './axios'

export interface Driver {
  id: number
  project_id: number
  full_name: string
  phone: string
  created_at: string
}

export interface DriverCreate {
  project_id: number
  full_name: string
  phone: string
}

export const driversApi = {
  getAll: async (projectId: number): Promise<Driver[]> => {
    const response = await api.get(`/drivers?project_id=${projectId}`)
    return response.data
  },

  getById: async (id: number): Promise<Driver> => {
    const response = await api.get(`/drivers/${id}`)
    return response.data
  },

  create: async (data: DriverCreate): Promise<Driver> => {
    const response = await api.post('/drivers', data)
    return response.data
  },

  update: async (id: number, data: DriverCreate): Promise<Driver> => {
    const response = await api.put(`/drivers/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/drivers/${id}`)
  },
}

