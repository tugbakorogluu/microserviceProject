'use client';

import React, { useState, useEffect } from 'react';
import { packageAPI, trackingAPI, notificationAPI } from '../lib/api-client';

export default function ServiceStatus() {
  const [statuses, setStatuses] = useState({
    package: null,
    tracking: null,
    notification: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServiceStatus();
    const interval = setInterval(checkServiceStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkServiceStatus = async () => {
    try {
      const packageStatus = await packageAPI.getHealth().then(
        (res) => ({ status: 'online', data: res.data }),
        () => ({ status: 'offline' })
      );

      const trackingStatus = await trackingAPI.getHealth().then(
        (res) => ({ status: 'online', data: res.data }),
        () => ({ status: 'offline' })
      );

      const notificationStatus = await notificationAPI.getHealth().then(
        (res) => ({ status: 'online', data: res.data }),
        () => ({ status: 'offline' })
      );

      setStatuses({
        package: packageStatus,
        tracking: trackingStatus,
        notification: notificationStatus,
      });
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ServiceCard = ({ title, icon, status, port }: any) => {
    const isOnline = status?.status === 'online';
    return (
      <div
        className={`rounded-lg p-6 border-2 ${
          isOnline
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-600">Port: {port}</p>
            </div>
          </div>
          <div className={`text-2xl ${isOnline ? '🟢' : '🔴'}`}></div>
        </div>

        <div className={`text-sm font-semibold ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
          {isOnline ? '✅ Çalışıyor' : '❌ Çevrim Dışı'}
        </div>

        {isOnline && status?.data && (
          <div className="mt-3 text-xs text-gray-600 space-y-1">
            <p>Service: {status.data.service}</p>
            <p>Updated: {new Date(status.data.timestamp).toLocaleTimeString('tr-TR')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🏥 Servis Durumu</h2>

      {/* Infrastructure Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-300">
          <h3 className="text-lg font-bold text-gray-800 mb-3">🐰 RabbitMQ</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Host:</strong> localhost:5672
            </p>
            <p>
              <strong>Admin UI:</strong> http://localhost:15672
            </p>
            <p>
              <strong>Credentials:</strong> guest/guest
            </p>
            <p>
              <strong>Durum:</strong> 🟢 <span className="text-green-700">Çalışıyor</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-300">
          <h3 className="text-lg font-bold text-gray-800 mb-3">🍃 MongoDB</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Package DB:</strong> localhost:27017
            </p>
            <p>
              <strong>Tracking DB:</strong> localhost:27018
            </p>
            <p>
              <strong>Notification DB:</strong> localhost:27019
            </p>
            <p>
              <strong>Durum:</strong> 🟢 <span className="text-green-700">Bağlı</span>
            </p>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Mikroservisler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ServiceCard
            title="Package Service"
            icon="📦"
            status={statuses.package}
            port="3001"
          />
          <ServiceCard
            title="Tracking Service"
            icon="🚚"
            status={statuses.tracking}
            port="3002"
          />
          <ServiceCard
            title="Notification Service"
            icon="🔔"
            status={statuses.notification}
            port="3003"
          />
        </div>
      </div>

      {/* Architecture Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🏗️ Mimari Bilgisi</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>📊 RabbitMQ Exchanges:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li>package.exchange (Topic)</li>
              <li>tracking.exchange (Topic)</li>
            </ul>
          </div>
          <div>
            <strong>🔄 Event Flow:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li>Package Service → package.created</li>
              <li>Tracking Service → package.delivered</li>
              <li>Notification Service → logs deliveries</li>
            </ul>
          </div>
          <div>
            <strong>📁 Veritabanları:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li>package_db - Kargo kayıtları</li>
              <li>tracking_db - Takip bilgileri</li>
              <li>notification_db - Bildirim logları</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
