import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { projectsApi, Project } from '../api/projects'
import { useAuth } from './AuthContext'

interface ProjectContextType {
  activeProject: Project | null
  projects: Project[] 
  setActiveProject: (project: Project | null) => void
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const { isAuthenticated } = useAuth()
  const isLoadingRef = useRef(false)

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || isLoadingRef.current) return
    
    // Token'ın hazır olması için kısa bir bekleme
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No token available, skipping project load')
      return
    }
    
    isLoadingRef.current = true
    try {
      const data = await projectsApi.getAll()
      setProjects(data)
      
      // If no active project but projects exist, set first one
      setActiveProjectState((current) => {
        if (current) return current
        
        if (data.length > 0) {
          const stored = localStorage.getItem('activeProject')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              const found = data.find(p => p.id === parsed.id)
              if (found) {
                return found
              }
            } catch {
              // Invalid stored project, use first one
            }
          }
          const firstProject = data[0]
          localStorage.setItem('activeProject', JSON.stringify(firstProject))
          return firstProject
        }
        return null
      })
    } catch (error: any) {
      console.error('Failed to load projects:', error)
      // 401 hatası alırsak, token geçersiz olabilir - ama login'e yönlendirme yapma
      // Sadece projeleri temizle
      if (error.response?.status === 401) {
        setProjects([])
        setActiveProjectState(null)
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      const stored = localStorage.getItem('activeProject')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setActiveProjectState(parsed)
        } catch {
          localStorage.removeItem('activeProject')
        }
      }
      // Only load projects if authenticated and not already loading
      // Token'ın hazır olması için gecikme
      if (!isLoadingRef.current) {
        const timer = setTimeout(() => {
          loadProjects()
        }, 1000)
        return () => clearTimeout(timer)
      }
    } else {
      // Clear everything when not authenticated
      setActiveProjectState(null)
      setProjects([])
      isLoadingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project)
    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project))
    } else {
      localStorage.removeItem('activeProject')
    }
  }

  const createProject = async (name: string, description?: string) => {
    try {
      console.log('Creating project:', { name, description })
      const project = await projectsApi.create({ name, description })
      console.log('Project created:', project)
      await loadProjects()
      setActiveProject(project)
      return project
    } catch (error: any) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        projects,
        setActiveProject,
        loadProjects,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

