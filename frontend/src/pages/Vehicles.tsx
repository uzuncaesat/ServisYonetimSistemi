import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { vehiclesApi, Vehicle, VehicleCreate, VehicleType } from '../api/vehicles'
import Modal from '../components/Modal'

const Vehicles = () => {
  const { activeProject } = useProject()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleCreate>({
    project_id: activeProject?.id || 0,
    plate: '',
    vehicle_type: 'minibus',
    capacity: 0,
  })

  useEffect(() => {
    if (activeProject) {
      loadVehicles()
    }
  }, [activeProject])

  const loadVehicles = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const data = await vehiclesApi.getAll(activeProject.id)
      setVehicles(data)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return

    // Validation
    if (!formData.plate.trim()) {
      alert('Plaka gereklidir!')
      return
    }
    if (formData.capacity <= 0) {
      alert('Kapasite 0\'dan büyük olmalıdır!')
      return
    }

    try {
      const vehicleData = { ...formData, project_id: activeProject.id }
      console.log('Creating vehicle:', vehicleData)
      
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, vehicleData)
      } else {
        await vehiclesApi.create(vehicleData)
      }
      await loadVehicles()
      setShowModal(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to save vehicle:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Kayıt başarısız!'
      alert(`Kayıt başarısız: ${errorMsg}`)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      project_id: vehicle.project_id,
      plate: vehicle.plate,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu aracı silmek istediğinize emin misiniz?')) return
    try {
      await vehiclesApi.delete(id)
      await loadVehicles()
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
      alert('Silme başarısız!')
    }
  }

  const resetForm = () => {
    setEditingVehicle(null)
    setFormData({
      project_id: activeProject?.id || 0,
      plate: '',
      vehicle_type: 'minibus',
      capacity: 0,
    })
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Araçlar</h1>
          <p className="text-gray-400">Proje araçlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Yeni Araç
        </button>
      </div>

      {loading ? (
        <div className="text-white">Yükleniyor...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Plaka</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Araç Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Kapasite</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">{vehicle.plate}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {vehicle.vehicle_type === 'minibus' && 'Minibüs'}
                    {vehicle.vehicle_type === 'midibus' && 'Midibüs'}
                    {vehicle.vehicle_type === 'bus' && 'Otobüs'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{vehicle.capacity}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicles.length === 0 && (
            <div className="p-8 text-center text-gray-400">Henüz araç kaydı yok.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingVehicle ? 'Araç Düzenle' : 'Yeni Araç'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plaka</label>
            <input
              type="text"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Araç Tipi</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as VehicleType })}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="minibus">Minibüs</option>
              <option value="midibus">Midibüs</option>
              <option value="bus">Otobüs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Kapasite</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              required
              min="1"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              {editingVehicle ? 'Güncelle' : 'Oluştur'}
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

export default Vehicles

