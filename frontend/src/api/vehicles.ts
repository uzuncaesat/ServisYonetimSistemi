import api from './axios'

export type VehicleType = 'minibus' | 'midibus' | 'bus'

export interface Vehicle {
  id: number
  project_id: number
  plate: string
  vehicle_type: VehicleType
  capacity: number
  created_at: string
}

export interface VehicleCreate {
  project_id: number
  plate: string
  vehicle_type: VehicleType
  capacity: number
}

export const vehiclesApi = {
  getAll: async (projectId: number): Promise<Vehicle[]> => {
    const response = await api.get(`/vehicles?project_id=${projectId}`)
    return response.data
  },

  getById: async (id: number): Promise<Vehicle> => {
    const response = await api.get(`/vehicles/${id}`)
    return response.data
  },

  create: async (data: VehicleCreate): Promise<Vehicle> => {
    const response = await api.post('/vehicles', data)
    return response.data
  },

  update: async (id: number, data: VehicleCreate): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehicles/${id}`)
  },
}

