import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CreatePackage from '../components/CreatePackage';
import PackageList from '../components/PackageList';
import TrackingList from '../components/TrackingList';
import NotificationList from '../components/NotificationList';
import ServiceStatus from '../components/ServiceStatus';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-gray-300">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'packages', label: '📦 Paketler' },
            { id: 'tracking', label: '🚚 Takip' },
            { id: 'notifications', label: '🔔 Bildirimler' },
            { id: 'status', label: '🏥 Servis Durumu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'dashboard' && (
            <Dashboard refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'packages' && (
            <PackagesTab
              onRefresh={handleRefresh}
              refreshTrigger={refreshTrigger}
            />
          )}
          {activeTab === 'tracking' && (
            <TrackingTab refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'status' && <ServiceStatus />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({ refreshTrigger }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Toplam Paket" icon="📦" />
        <StatCard title="Teslim Edilen" icon="✅" />
        <StatCard title="Bildirim Gönderilen" icon="🔔" />
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🎯 Akıllı Kargo ve Paket Takip Sistemi
        </h3>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-gray-700">
            Bu sistem, 3 bağımsız NestJS mikroservisi kullanarak tamamen
            event-driven mimarisi ile çalışmaktadır. Her servisin kendine ait
            MongoDB veritabanı ve RabbitMQ üzerinden asenkron haberleşme
            yapılmaktadır.
          </p>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>
              ✨ <strong>Package Service:</strong> Kargo kayıt ve barkod
              üretimi
            </li>
            <li>
              ✨ <strong>Tracking Service:</strong> Durumu simülasyon ile takip
            </li>
            <li>
              ✨ <strong>Notification Service:</strong> Müşteri bildirimleri
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold mt-2">-</p>
    </div>
  );
}

function PackagesTab({ onRefresh, refreshTrigger }) {
  return (
    <div className="space-y-6">
      <CreatePackage onPackageCreated={onRefresh} />
      <PackageList refreshTrigger={refreshTrigger} />
    </div>
  );
}

function TrackingTab({ refreshTrigger }) {
  return <TrackingList refreshTrigger={refreshTrigger} />;
}

function NotificationsTab({ refreshTrigger }) {
  return <NotificationList refreshTrigger={refreshTrigger} />;
}
