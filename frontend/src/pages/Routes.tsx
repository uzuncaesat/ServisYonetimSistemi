import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { routesApi, Route, RouteCreate } from '../api/routes'
import Modal from '../components/Modal'

const Routes = () => {
  const { activeProject } = useProject()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [formData, setFormData] = useState<RouteCreate>({
    project_id: activeProject?.id || 0,
    name: '',
    start_point: '',
    end_point: '',
    estimated_km: 0,
    estimated_duration: 0,
  })

  useEffect(() => {
    if (activeProject) {
      loadRoutes()
    }
  }, [activeProject])

  const loadRoutes = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const data = await routesApi.getAll(activeProject.id)
      setRoutes(data)
    } catch (error) {
      console.error('Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return

    try {
      if (editingRoute) {
        await routesApi.update(editingRoute.id, { ...formData, project_id: activeProject.id })
      } else {
        await routesApi.create({ ...formData, project_id: activeProject.id })
      }
      await loadRoutes()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save route:', error)
      alert('Kayıt başarısız!')
    }
  }

  const handleEdit = (route: Route) => {
    setEditingRoute(route)
    setFormData({
      project_id: route.project_id,
      name: route.name,
      start_point: route.start_point,
      end_point: route.end_point,
      estimated_km: route.estimated_km,
      estimated_duration: route.estimated_duration,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu güzergahı silmek istediğinize emin misiniz?')) return
    try {
      await routesApi.delete(id)
      await loadRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
      alert('Silme başarısız!')
    }
  }

  const resetForm = () => {
    setEditingRoute(null)
    setFormData({
      project_id: activeProject?.id || 0,
      name: '',
      start_point: '',
      end_point: '',
      estimated_km: 0,
      estimated_duration: 0,
    })
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Güzergahlar</h1>
          <p className="text-gray-400">Proje güzergahlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Yeni Güzergah
        </button>
      </div>

      {loading ? (
        <div className="text-white">Yükleniyor...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Güzergah Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Başlangıç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Bitiş</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tahmini KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tahmini Süre (dk)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">{route.name}</td>
                  <td className="px-6 py-4 text-gray-300">{route.start_point}</td>
                  <td className="px-6 py-4 text-gray-300">{route.end_point}</td>
                  <td className="px-6 py-4 text-gray-300">{route.estimated_km}</td>
                  <td className="px-6 py-4 text-gray-300">{route.estimated_duration}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(route)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="p-8 text-center text-gray-400">Henüz güzergah kaydı yok.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingRoute ? 'Güzergah Düzenle' : 'Yeni Güzergah'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Güzergah Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Başlangıç Noktası</label>
            <input
              type="text"
              value={formData.start_point}
              onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bitiş Noktası</label>
            <input
              type="text"
              value={formData.end_point}
              onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tahmini KM</label>
              <input
                type="number"
                step="0.1"
                value={formData.estimated_km}
                onChange={(e) => setFormData({ ...formData, estimated_km: parseFloat(e.target.value) })}
                required
                min="0"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tahmini Süre (dakika)</label>
              <input
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              {editingRoute ? 'Güncelle' : 'Oluştur'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition"
            >
              İptal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Routes

