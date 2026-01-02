import api from './axios'

export type TripStatus = 'pending' | 'started' | 'completed'

export interface Trip {
  id: number
  project_id: number
  vehicle_id: number
  driver_id: number
  route_id: number
  date: string
  passenger_count: number
  status: TripStatus
  notes?: string
  actual_km?: number
  created_at: string
  completed_at?: string
}

export interface TripCreate {
  project_id: number
  vehicle_id: number
  driver_id: number
  route_id: number
  date: string
  passenger_count: number
  notes?: string
}

export interface TripUpdate {
  status?: TripStatus
  actual_km?: number
  notes?: string
  passenger_count?: number
}

export const tripsApi = {
  getAll: async (projectId: number): Promise<Trip[]> => {
    const response = await api.get(`/trips?project_id=${projectId}`)
    return response.data
  },

  getById: async (id: number): Promise<Trip> => {
    const response = await api.get(`/trips/${id}`)
    return response.data
  },

  create: async (data: TripCreate): Promise<Trip> => {
    const response = await api.post('/trips', data)
    return response.data
  },

  update: async (id: number, data: TripUpdate): Promise<Trip> => {
    const response = await api.put(`/trips/${id}`, data)
    return response.data
  },

  start: async (id: number): Promise<Trip> => {
    const response = await api.post(`/trips/${id}/start`)
    return response.data
  },

  complete: async (id: number, actualKm: number): Promise<Trip> => {
    const response = await api.post(`/trips/${id}/complete`, { actual_km: actualKm })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/trips/${id}`)
  },
}

