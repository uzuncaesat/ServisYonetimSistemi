import api from './axios'

export interface Route {
  id: number
  project_id: number
  name: string
  start_point: string
  end_point: string
  estimated_km: number
  estimated_duration: number
  created_at: string
}

export interface RouteCreate {
  project_id: number
  name: string
  start_point: string
  end_point: string
  estimated_km: number
  estimated_duration: number
}

export const routesApi = {
  getAll: async (projectId: number): Promise<Route[]> => {
    const response = await api.get(`/routes?project_id=${projectId}`)
    return response.data
  },

  getById: async (id: number): Promise<Route> => {
    const response = await api.get(`/routes/${id}`)
    return response.data
  },

  create: async (data: RouteCreate): Promise<Route> => {
    const response = await api.post('/routes', data)
    return response.data
  },

  update: async (id: number, data: RouteCreate): Promise<Route> => {
    const response = await api.put(`/routes/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/routes/${id}`)
  },
}

