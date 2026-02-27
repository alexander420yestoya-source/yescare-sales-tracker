'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => router.push('/login'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password minimal 8 karakter.');
    }
    if (password !== confirm) {
      return setError('Konfirmasi password tidak cocok.');
    }

    setLoading(true);
    try {
      await api.changePassword(password);
      if (user?.role === 'owner') {
        router.push('/owner');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-blue-700">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-white">YESCARE</h1>
          <p className="text-blue-200 text-sm mt-1">Sales Balance Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Buat Password Baru</h2>
          <p className="text-sm text-gray-500 mb-5">
            Akun baru harus ganti password sebelum bisa lanjut.
          </p>

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
              className="btn-primary w-full py-3 mt-2"
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
    </div>
  );
}
