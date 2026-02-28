'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { getStoredUser } from '../../../lib/auth';

export default function SettingsPage() {
  const router = useRouter();
  const user = getStoredUser();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password.length < 8) {
      return setError('Password minimal 8 karakter.');
    }
    if (password !== confirm) {
      return setError('Konfirmasi password tidak cocok.');
    }

    setLoading(true);
    try {
      await api.changePassword(password);
      setSuccess(true);
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-xs text-gray-500 mt-0.5">Kelola akun kamu.</p>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-xl">
              {user?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className="text-xs capitalize text-blue-600 font-medium">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Ganti Password</h2>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
            Password berhasil diperbarui.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Password Baru</label>
            <input
              type="password"
              className="input"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Konfirmasi Password</label>
            <input
              type="password"
              className="input"
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              'Simpan Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
