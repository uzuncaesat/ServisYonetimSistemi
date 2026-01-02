import api from './axios'

export interface MonthlyReport {
  month: number
  year: number
  total_km: number
  total_trips: number
  total_revenue: number
}

export interface VehicleReport {
  vehicle_id: number
  vehicle_plate: string
  total_km: number
  total_trips: number
  total_revenue: number
}

export interface DriverReport {
  driver_id: number
  driver_name: string
  total_km: number
  total_trips: number
  total_revenue: number
}

export const reportsApi = {
  getMonthly: async (projectId: number, month: number, year: number): Promise<MonthlyReport> => {
    const response = await api.get(`/reports/monthly?project_id=${projectId}&month=${month}&year=${year}`)
    return response.data
  },

  getVehicles: async (projectId: number, month: number, year: number): Promise<VehicleReport[]> => {
    const response = await api.get(`/reports/vehicles?project_id=${projectId}&month=${month}&year=${year}`)
    return response.data
  },

  getDrivers: async (projectId: number, month: number, year: number): Promise<DriverReport[]> => {
    const response = await api.get(`/reports/drivers?project_id=${projectId}&month=${month}&year=${year}`)
    return response.data
  },
}

