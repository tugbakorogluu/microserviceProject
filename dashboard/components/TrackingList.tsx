'use client';

import React, { useState, useEffect } from 'react';
import { trackingAPI } from '../lib/api-client';

interface TrackingListProps {
  refreshTrigger: number;
}

export default function TrackingList({ refreshTrigger }: TrackingListProps) {
  const [trackings, setTrackings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTrackings();
  }, [refreshTrigger, statusFilter]);

  const fetchTrackings = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (statusFilter) {
        response = await trackingAPI.getTrackingsByStatus(statusFilter);
      } else {
        response = await trackingAPI.getAllTrackings();
      }
      setTrackings(response.data.data || []);
    } catch (err: any) {
      setError('Takip bilgileri yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return 'bg-yellow-100 text-yellow-800';
      case 'Yolda':
        return 'bg-blue-100 text-blue-800';
      case 'Dağıtımda':
        return 'bg-orange-100 text-orange-800';
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Hazırlanıyor':
        return '📋';
      case 'Yolda':
        return '🚚';
      case 'Dağıtımda':
        return '📍';
      case 'Teslim Edildi':
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🚚 Takip Bilgileri</h2>
        <button
          onClick={fetchTrackings}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          🔄 Yenile
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Hazırlanıyor', 'Yolda', 'Dağıtımda', 'Teslim Edildi'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {status || 'Tümü'}
            </button>
          )
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">⏳ Takip bilgileri yükleniyor...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {!loading && trackings.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Henüz takip bilgisi bulunmuyor</p>
        </div>
      )}

      {!loading && trackings.length > 0 && (
        <div className="grid gap-4">
          {trackings.map((tracking: any) => (
            <div
              key={tracking._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Barkod</p>
                  <p className="text-gray-800 font-mono">{tracking.barcode}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Gönderici</p>
                  <p className="text-gray-800">{tracking.sender || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Alıcı</p>
                  <p className="text-gray-800">{tracking.receiver || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Statü</p>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(
                      tracking.currentStatus
                    )}`}
                  >
                    <span>{getStatusIcon(tracking.currentStatus)}</span>
                    <span>{tracking.currentStatus}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Güncelleme</p>
                  <p className="text-gray-800 text-sm">
                    {new Date(tracking.updatedAt).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
