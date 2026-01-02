import api from './axios'

export interface Project {
  id: number
  name: string
  description?: string
  created_by?: number
  created_at: string
}

export interface ProjectCreate {
  name: string
  description?: string
}

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects')
    return response.data
  },

  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  create: async (data: ProjectCreate): Promise<Project> => {
    const response = await api.post('/projects', data)
    return response.data
  },

  update: async (id: number, data: ProjectCreate): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`)
  },
}

