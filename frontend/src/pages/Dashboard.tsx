import { useProject } from '../contexts/ProjectContext'

const Dashboard = () => {
  const { activeProject } = useProject()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Sistem durumu ve özet bilgiler</p>
      </div>

      {activeProject && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Aktif Proje</div>
            <div className="text-2xl font-bold text-white">{activeProject.name}</div>
            {activeProject.description && (
              <div className="text-gray-400 text-sm mt-2">{activeProject.description}</div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Sistem Durumu</div>
            <div className="text-2xl font-bold text-green-400">Aktif</div>
            <div className="text-gray-400 text-sm mt-2">Tüm servisler çalışıyor</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Versiyon</div>
            <div className="text-2xl font-bold text-white">1.0.0</div>
            <div className="text-gray-400 text-sm mt-2">Demo / MVP</div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/vehicles"
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition text-center"
          >
            <div className="text-3xl mb-2">🚌</div>
            <div className="text-white font-semibold">Araçlar</div>
          </a>
          <a
            href="/drivers"
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition text-center"
          >
            <div className="text-3xl mb-2">👤</div>
            <div className="text-white font-semibold">Sürücüler</div>
          </a>
          <a
            href="/trips"
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition text-center"
          >
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-white font-semibold">Seferler</div>
          </a>
          <a
            href="/reports"
            className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg transition text-center"
          >
            <div className="text-3xl mb-2">📈</div>
            <div className="text-white font-semibold">Raporlar</div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

