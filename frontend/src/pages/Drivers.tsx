import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { driversApi, Driver, DriverCreate } from '../api/drivers'
import Modal from '../components/Modal'

const Drivers = () => {
  const { activeProject } = useProject()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState<DriverCreate>({
    project_id: activeProject?.id || 0,
    full_name: '',
    phone: '',
  })

  useEffect(() => {
    if (activeProject) {
      loadDrivers()
    }
  }, [activeProject])

  const loadDrivers = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const data = await driversApi.getAll(activeProject.id)
      setDrivers(data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return

    try {
      if (editingDriver) {
        await driversApi.update(editingDriver.id, { ...formData, project_id: activeProject.id })
      } else {
        await driversApi.create({ ...formData, project_id: activeProject.id })
      }
      await loadDrivers()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save driver:', error)
      alert('Kayıt başarısız!')
    }
  }

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setFormData({
      project_id: driver.project_id,
      full_name: driver.full_name,
      phone: driver.phone,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu sürücüyü silmek istediğinize emin misiniz?')) return
    try {
      await driversApi.delete(id)
      await loadDrivers()
    } catch (error) {
      console.error('Failed to delete driver:', error)
      alert('Silme başarısız!')
    }
  }

  const resetForm = () => {
    setEditingDriver(null)
    setFormData({
      project_id: activeProject?.id || 0,
      full_name: '',
      phone: '',
    })
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sürücüler</h1>
          <p className="text-gray-400">Proje sürücülerini yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Yeni Sürücü
        </button>
      </div>

      {loading ? (
        <div className="text-white">Yükleniyor...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Telefon</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">{driver.full_name}</td>
                  <td className="px-6 py-4 text-gray-300">{driver.phone}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {drivers.length === 0 && (
            <div className="p-8 text-center text-gray-400">Henüz sürücü kaydı yok.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingDriver ? 'Sürücü Düzenle' : 'Yeni Sürücü'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Soyad</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              {editingDriver ? 'Güncelle' : 'Oluştur'}
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

export default Drivers

