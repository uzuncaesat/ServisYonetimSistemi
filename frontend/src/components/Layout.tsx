import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProject } from '../contexts/ProjectContext'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuth()
  const { activeProject, projects, setActiveProject, createProject } = useProject()
  const location = useLocation()
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [projectError, setProjectError] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const handleCreateProject = async () => {
    console.log('handleCreateProject called', { newProjectName, newProjectDesc })
    
    if (!newProjectName.trim()) {
      setProjectError('Proje adı gereklidir')
      return
    }
    
    setProjectError('')
    setProjectLoading(true)
    
    try {
      console.log('Calling createProject...')
      await createProject(newProjectName, newProjectDesc)
      console.log('Project created successfully')
      setNewProjectName('')
      setNewProjectDesc('')
      setShowProjectModal(false)
    } catch (error: any) {
      console.error('Proje oluşturma hatası:', error)
      setProjectError(error.response?.data?.detail || error.message || 'Proje oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setProjectLoading(false)
    }
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/vehicles', label: 'Araçlar', icon: '🚌' },
    { path: '/drivers', label: 'Sürücüler', icon: '👤' },
    { path: '/routes', label: 'Güzergahlar', icon: '🗺️' },
    { path: '/route-prices', label: 'Güzergah Fiyatları', icon: '💰' },
    { path: '/trips', label: 'Seferler', icon: '🚗' },
    { path: '/reports', label: 'Raporlar', icon: '📈' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">UZHAN</h1>
          <p className="text-sm text-gray-400">Servis Yönetimi</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">{user?.full_name}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === parseInt(e.target.value))
                  setActiveProject(project || null)
                }}
                className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Proje Seçin</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowProjectModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                + Yeni Proje
              </button>
            </div>
            {activeProject && (
              <div className="text-sm text-gray-400">
                Aktif Proje: <span className="text-white font-semibold">{activeProject.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {!activeProject ? (
            <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-6 py-4 rounded-lg">
              <p className="font-semibold">⚠️ Proje Seçimi Gerekli</p>
              <p className="mt-2">İşlem yapabilmek için lütfen bir proje seçin veya yeni proje oluşturun.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Yeni Proje Oluştur</h2>
            <div className="space-y-4">
              {projectError && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                  {projectError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Proje Adı</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value)
                    setProjectError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !projectLoading) {
                      handleCreateProject()
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: ABC Okulu Servis Projesi"
                  disabled={projectLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Açıklama (Opsiyonel)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={projectLoading}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateProject}
                  disabled={projectLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {projectLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button
                  onClick={() => {
                    setShowProjectModal(false)
                    setNewProjectName('')
                    setNewProjectDesc('')
                    setProjectError('')
                  }}
                  disabled={projectLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout

