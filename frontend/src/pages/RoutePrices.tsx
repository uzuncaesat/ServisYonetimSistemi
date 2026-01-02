import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { routesApi, Route } from '../api/routes'
import { routePricesApi, RoutePrice, RoutePriceCreate } from '../api/routePrices'
import { VehicleType } from '../api/vehicles'
import Modal from '../components/Modal'

const RoutePrices = () => {
  const { activeProject } = useProject()
  const [routes, setRoutes] = useState<Route[]>([])
  const [routePrices, setRoutePrices] = useState<RoutePrice[]>([])
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPrice, setEditingPrice] = useState<RoutePrice | null>(null)
  const [formData, setFormData] = useState<RoutePriceCreate>({
    route_id: 0,
    vehicle_type: 'minibus',
    price_per_km: 0,
  })

  useEffect(() => {
    if (activeProject) {
      loadRoutes()
    }
  }, [activeProject])

  useEffect(() => {
    if (selectedRoute) {
      loadRoutePrices()
    }
  }, [selectedRoute])

  const loadRoutes = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const data = await routesApi.getAll(activeProject.id)
      setRoutes(data)
      if (data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoutePrices = async () => {
    if (!selectedRoute) return
    setLoading(true)
    try {
      const data = await routePricesApi.getAll(selectedRoute)
      setRoutePrices(data)
    } catch (error) {
      console.error('Failed to load route prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoute) return

    try {
      if (editingPrice) {
        await routePricesApi.update(editingPrice.id, { ...formData, route_id: selectedRoute })
      } else {
        await routePricesApi.create({ ...formData, route_id: selectedRoute })
      }
      await loadRoutePrices()
      setShowModal(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to save route price:', error)
      alert(error.response?.data?.detail || 'Kayıt başarısız!')
    }
  }

  const handleEdit = (price: RoutePrice) => {
    setEditingPrice(price)
    setFormData({
      route_id: price.route_id,
      vehicle_type: price.vehicle_type,
      price_per_km: price.price_per_km,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu fiyatı silmek istediğinize emin misiniz?')) return
    try {
      await routePricesApi.delete(id)
      await loadRoutePrices()
    } catch (error) {
      console.error('Failed to delete route price:', error)
      alert('Silme başarısız!')
    }
  }

  const resetForm = () => {
    setEditingPrice(null)
    setFormData({
      route_id: selectedRoute || 0,
      vehicle_type: 'minibus',
      price_per_km: 0,
    })
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  const selectedRouteData = routes.find(r => r.id === selectedRoute)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Güzergah Fiyatları</h1>
          <p className="text-gray-400">Güzergah ve araç tipine göre km birim fiyatlarını yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          disabled={!selectedRoute}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
        >
          + Yeni Fiyat
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Güzergah Seçin</label>
        <select
          value={selectedRoute || ''}
          onChange={(e) => setSelectedRoute(parseInt(e.target.value))}
          className="w-full md:w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Güzergah seçin</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRouteData && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{selectedRouteData.name}</h3>
          <p className="text-gray-400 text-sm">
            {selectedRouteData.start_point} → {selectedRouteData.end_point} ({selectedRouteData.estimated_km} km)
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-white">Yükleniyor...</div>
      ) : selectedRoute ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Araç Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">KM Birim Fiyatı (₺)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {routePrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">
                    {price.vehicle_type === 'minibus' && 'Minibüs'}
                    {price.vehicle_type === 'midibus' && 'Midibüs'}
                    {price.vehicle_type === 'bus' && 'Otobüs'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{price.price_per_km.toFixed(2)} ₺</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(price)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(price.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {routePrices.length === 0 && (
            <div className="p-8 text-center text-gray-400">Bu güzergah için henüz fiyat kaydı yok.</div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
          Lütfen bir güzergah seçin.
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingPrice ? 'Fiyat Düzenle' : 'Yeni Fiyat'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">KM Birim Fiyatı (₺)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price_per_km}
              onChange={(e) => setFormData({ ...formData, price_per_km: parseFloat(e.target.value) })}
              required
              min="0"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              {editingPrice ? 'Güncelle' : 'Oluştur'}
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

export default RoutePrices

