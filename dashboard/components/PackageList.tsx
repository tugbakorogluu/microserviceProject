'use client';

import React, { useState, useEffect } from 'react';
import { packageAPI } from '../lib/api-client';

interface PackageListProps {
  refreshTrigger: number;
}

export default function PackageList({ refreshTrigger }: PackageListProps) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackages();
  }, [refreshTrigger]);

  const fetchPackages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await packageAPI.getAllPackages();
      setPackages(response.data.data || []);
    } catch (err: any) {
      setError('Paketler yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📦 Paket Listesi</h2>
        <button
          onClick={fetchPackages}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          🔄 Yenile
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">⏳ Paketler yükleniyor...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {!loading && packages.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Henüz paket oluşturulmamış</p>
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="grid gap-4">
          {packages.map((pkg: any) => (
            <div
              key={pkg._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Barkod</p>
                  <p className="text-gray-800 font-mono text-lg">{pkg.barcode}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Gönderici</p>
                  <p className="text-gray-800">{pkg.sender}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Alıcı</p>
                  <p className="text-gray-800">{pkg.receiver}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Statü</p>
                  <p className="text-yellow-600 font-semibold">{pkg.status}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Oluşturulan: {new Date(pkg.createdAt).toLocaleString('tr-TR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
