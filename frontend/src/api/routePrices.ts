import api from './axios'
import { VehicleType } from './vehicles'

export interface RoutePrice {
  id: number
  route_id: number
  vehicle_type: VehicleType
  price_per_km: number
  created_at: string
}

export interface RoutePriceCreate {
  route_id: number
  vehicle_type: VehicleType
  price_per_km: number
}

export const routePricesApi = {
  getAll: async (routeId: number): Promise<RoutePrice[]> => {
    const response = await api.get(`/route-prices?route_id=${routeId}`)
    return response.data
  },

  getById: async (id: number): Promise<RoutePrice> => {
    const response = await api.get(`/route-prices/${id}`)
    return response.data
  },

  create: async (data: RoutePriceCreate): Promise<RoutePrice> => {
    const response = await api.post('/route-prices', data)
    return response.data
  },

  update: async (id: number, data: RoutePriceCreate): Promise<RoutePrice> => {
    const response = await api.put(`/route-prices/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/route-prices/${id}`)
  },
}

