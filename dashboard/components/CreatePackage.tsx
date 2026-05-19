'use client';

import React, { useState } from 'react';
import { packageAPI } from '../lib/api-client';

interface CreatePackageProps {
  onPackageCreated: () => void;
}

export default function CreatePackage({ onPackageCreated }: CreatePackageProps) {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await packageAPI.createPackage(sender, receiver);
      setMessage(
        `✅ Paket başarıyla oluşturuldu! Barkod: ${response.data.data.barcode}`
      );
      setSender('');
      setReceiver('');
      onPackageCreated();
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setError(
        err.message || 'Paket oluşturulurken hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Yeni Paket Oluştur</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gönderici Adı
            </label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Gönderici adını girin"
              required
              minLength={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Alıcı Adı
            </label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="Alıcı adını girin"
              required
              minLength={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Oluşturuluyor...' : '✨ Paketi Oluştur'}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
