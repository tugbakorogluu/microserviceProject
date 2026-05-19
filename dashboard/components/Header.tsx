export default function Header() {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">📦</div>
            <div>
              <h1 className="text-3xl font-bold">Akıllı Kargo Sistemi</h1>
              <p className="text-blue-100 text-sm mt-1">
                Event-Driven Mikroservis Mimarisi
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <p className="text-blue-100 text-xs">RabbitMQ</p>
              <p className="text-lg font-semibold">🟢 Aktif</p>
            </div>
            <div className="text-center">
              <p className="text-blue-100 text-xs">MongoDB</p>
              <p className="text-lg font-semibold">🟢 Bağlı</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
