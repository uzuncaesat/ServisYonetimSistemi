import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { tripsApi, Trip, TripCreate, TripStatus } from '../api/trips'
import { vehiclesApi, Vehicle } from '../api/vehicles'
import { driversApi, Driver } from '../api/drivers'
import { routesApi, Route } from '../api/routes'
import Modal from '../components/Modal'

const Trips = () => {
  const { activeProject } = useProject()
  const [trips, setTrips] = useState<Trip[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState<TripCreate>({
    project_id: activeProject?.id || 0,
    vehicle_id: 0,
    driver_id: 0,
    route_id: 0,
    date: new Date().toISOString().slice(0, 16),
    passenger_count: 0,
    notes: '',
  })

  useEffect(() => {
    if (activeProject) {
      loadTrips()
      loadVehicles()
      loadDrivers()
      loadRoutes()
    }
  }, [activeProject])

  const loadTrips = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const data = await tripsApi.getAll(activeProject.id)
      setTrips(data)
    } catch (error) {
      console.error('Failed to load trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVehicles = async () => {
    if (!activeProject) return
    try {
      const data = await vehiclesApi.getAll(activeProject.id)
      setVehicles(data)
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    }
  }

  const loadDrivers = async () => {
    if (!activeProject) return
    try {
      const data = await driversApi.getAll(activeProject.id)
      setDrivers(data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    }
  }

  const loadRoutes = async () => {
    if (!activeProject) return
    try {
      const data = await routesApi.getAll(activeProject.id)
      setRoutes(data)
    } catch (error) {
      console.error('Failed to load routes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProject) return

    try {
      if (editingTrip) {
        await tripsApi.update(editingTrip.id, {
          notes: formData.notes,
          passenger_count: formData.passenger_count,
        })
      } else {
        await tripsApi.create({ ...formData, project_id: activeProject.id })
      }
      await loadTrips()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save trip:', error)
      alert('Kayıt başarısız!')
    }
  }

  const handleStart = async (id: number) => {
    try {
      await tripsApi.start(id)
      await loadTrips()
    } catch (error) {
      console.error('Failed to start trip:', error)
      alert('Sefer başlatılamadı!')
    }
  }

  const handleComplete = async (id: number, km: number) => {
    try {
      await tripsApi.complete(id, km)
      await loadTrips()
    } catch (error) {
      console.error('Failed to complete trip:', error)
      alert('Sefer tamamlanamadı!')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu seferi silmek istediğinize emin misiniz?')) return
    try {
      await tripsApi.delete(id)
      await loadTrips()
    } catch (error) {
      console.error('Failed to delete trip:', error)
      alert('Silme başarısız!')
    }
  }

  const resetForm = () => {
    setEditingTrip(null)
    setFormData({
      project_id: activeProject?.id || 0,
      vehicle_id: 0,
      driver_id: 0,
      route_id: 0,
      date: new Date().toISOString().slice(0, 16),
      passenger_count: 0,
      notes: '',
    })
  }

  const getStatusBadge = (status: TripStatus) => {
    const styles = {
      pending: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
      started: 'bg-blue-900/50 text-blue-200 border-blue-700',
      completed: 'bg-green-900/50 text-green-200 border-green-700',
    }
    const labels = {
      pending: 'Beklemede',
      started: 'Başladı',
      completed: 'Tamamlandı',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs border ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Seferler</h1>
          <p className="text-gray-400">Günlük sefer kayıtlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Yeni Sefer
        </button>
      </div>

      {loading ? (
        <div className="text-white">Yükleniyor...</div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Araç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sürücü</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Güzergah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Yolcu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">KM</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {trips.map((trip) => {
                const vehicle = vehicles.find(v => v.id === trip.vehicle_id)
                const driver = drivers.find(d => d.id === trip.driver_id)
                const route = routes.find(r => r.id === trip.route_id)
                return (
                  <tr key={trip.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-white">
                      {new Date(trip.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{vehicle?.plate || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{driver?.full_name || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{route?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{trip.passenger_count}</td>
                    <td className="px-6 py-4">{getStatusBadge(trip.status)}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {trip.actual_km ? `${trip.actual_km.toFixed(1)} km` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {trip.status === 'pending' && (
                        <button
                          onClick={() => handleStart(trip.id)}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Başlat
                        </button>
                      )}
                      {trip.status === 'started' && (
                        <button
                          onClick={async () => {
                            const km = prompt('Gerçek KM değerini girin:')
                            if (km && parseFloat(km) > 0) {
                              await handleComplete(trip.id, parseFloat(km))
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Bitir
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(trip.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {trips.length === 0 && (
            <div className="p-8 text-center text-gray-400">Henüz sefer kaydı yok.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingTrip ? 'Sefer Düzenle' : 'Yeni Sefer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Araç</label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: parseInt(e.target.value) })}
              required
              disabled={!!editingTrip}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Araç seçin</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} ({vehicle.vehicle_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sürücü</label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: parseInt(e.target.value) })}
              required
              disabled={!!editingTrip}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Sürücü seçin</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Güzergah</label>
            <select
              value={formData.route_id}
              onChange={(e) => setFormData({ ...formData, route_id: parseInt(e.target.value) })}
              required
              disabled={!!editingTrip}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Güzergah seçin</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tarih</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={!!editingTrip}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Yolcu Sayısı</label>
            <input
              type="number"
              value={formData.passenger_count}
              onChange={(e) => setFormData({ ...formData, passenger_count: parseInt(e.target.value) })}
              required
              min="0"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notlar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              {editingTrip ? 'Güncelle' : 'Oluştur'}
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

export default Trips

