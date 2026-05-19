'use client';

import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../lib/api-client';

interface NotificationListProps {
  refreshTrigger: number;
}

export default function NotificationList({ refreshTrigger }: NotificationListProps) {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchStatistics();
  }, [refreshTrigger, statusFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (statusFilter) {
        response = await notificationAPI.getNotificationsByStatus(statusFilter);
      } else {
        response = await notificationAPI.getAllNotifications();
      }
      setNotifications(response.data.data || []);
    } catch (err: any) {
      setError('Bildirimler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await notificationAPI.getStatistics();
      setStats(response.data.statistics);
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">🔔 Bildirim Logları</h2>
        <button
          onClick={() => {
            fetchNotifications();
            fetchStatistics();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          🔄 Yenile
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-gray-600 text-sm">Toplam Bildirim</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-gray-600 text-sm">Gönderilen</p>
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-gray-600 text-sm">Beklemede</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <p className="text-gray-600 text-sm">Başarısız</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Sent', 'Pending', 'Failed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-2 rounded-lg transition ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status ? (status === 'Sent' ? '✅ Gönderilen' : status === 'Pending' ? '⏳ Beklemede' : '❌ Başarısız') : 'Tümü'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">⏳ Bildirimler yükleniyor...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Henüz bildirim bulunmuyor</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="grid gap-4">
          {notifications.map((notif: any) => (
            <div
              key={notif._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Barkod</p>
                  <p className="text-gray-800 font-mono">{notif.barcode}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Mesaj</p>
                  <p className="text-gray-800 text-sm">{notif.messageContent}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold">Statü</p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(
                        notif.deliveryStatus
                      )}`}
                    >
                      {notif.deliveryStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gönderilen: {new Date(notif.sentAt).toLocaleString('tr-TR')}
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
