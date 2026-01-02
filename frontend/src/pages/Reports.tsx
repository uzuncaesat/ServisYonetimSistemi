import { useState, useEffect } from 'react'
import { useProject } from '../contexts/ProjectContext'
import { reportsApi, MonthlyReport, VehicleReport, DriverReport } from '../api/reports'

const Reports = () => {
  const { activeProject } = useProject()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [vehicleReports, setVehicleReports] = useState<VehicleReport[]>([])
  const [driverReports, setDriverReports] = useState<DriverReport[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'monthly' | 'vehicles' | 'drivers'>('monthly')

  useEffect(() => {
    if (activeProject) {
      loadReports()
    }
  }, [activeProject, month, year])

  const loadReports = async () => {
    if (!activeProject) return
    setLoading(true)
    try {
      const [monthly, vehicles, drivers] = await Promise.all([
        reportsApi.getMonthly(activeProject.id, month, year),
        reportsApi.getVehicles(activeProject.id, month, year),
        reportsApi.getDrivers(activeProject.id, month, year),
      ])
      setMonthlyReport(monthly)
      setVehicleReports(vehicles)
      setDriverReports(drivers)
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!activeProject) {
    return <div className="text-white">Lütfen bir proje seçin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Raporlar</h1>
          <p className="text-gray-400">Aylık raporlama ve analizler</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleDateString('tr-TR', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'monthly'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Genel Özet
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'vehicles'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Araç Bazlı
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'drivers'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sürücü Bazlı
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-white text-center py-8">Yükleniyor...</div>
          ) : (
            <>
              {activeTab === 'monthly' && monthlyReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">Toplam KM</div>
                    <div className="text-3xl font-bold text-white">{monthlyReport.total_km.toFixed(1)} km</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">Toplam Sefer</div>
                    <div className="text-3xl font-bold text-white">{monthlyReport.total_trips}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="text-gray-400 text-sm mb-2">Toplam Gelir</div>
                    <div className="text-3xl font-bold text-green-400">
                      {monthlyReport.total_revenue.toFixed(2)} ₺
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vehicles' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Araç Plakası</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam KM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam Sefer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam Gelir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {vehicleReports.map((report) => (
                        <tr key={report.vehicle_id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-white">{report.vehicle_plate}</td>
                          <td className="px-6 py-4 text-gray-300">{report.total_km.toFixed(1)} km</td>
                          <td className="px-6 py-4 text-gray-300">{report.total_trips}</td>
                          <td className="px-6 py-4 text-green-400 font-semibold">
                            {report.total_revenue.toFixed(2)} ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vehicleReports.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Bu ay için veri yok.</div>
                  )}
                </div>
              )}

              {activeTab === 'drivers' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sürücü Adı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam KM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam Sefer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Toplam Gelir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {driverReports.map((report) => (
                        <tr key={report.driver_id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 text-white">{report.driver_name}</td>
                          <td className="px-6 py-4 text-gray-300">{report.total_km.toFixed(1)} km</td>
                          <td className="px-6 py-4 text-gray-300">{report.total_trips}</td>
                          <td className="px-6 py-4 text-green-400 font-semibold">
                            {report.total_revenue.toFixed(2)} ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {driverReports.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Bu ay için veri yok.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports

