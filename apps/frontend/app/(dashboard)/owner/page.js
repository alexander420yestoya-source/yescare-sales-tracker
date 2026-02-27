'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { healthColor, healthLabel } from '../../../lib/utils';

function HealthDot({ health }) {
  const colors = { green: 'bg-green-400', yellow: 'bg-yellow-400', red: 'bg-red-400' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[health] || 'bg-gray-400'}`} />;
}

export default function OwnerPage() {
  const [salesTeam, setSalesTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tambah Anggota form state
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'sales' });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [createError, setCreateError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await api.getSalesTeam();
      setSalesTeam(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const result = await api.createUser(newUser);
      setCreateResult(result);
      setNewUser({ name: '', email: '', role: 'sales' });
      loadData();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const totalPendingExt = salesTeam.reduce((sum, s) => sum + (s.pending_extensions || 0), 0);
  const totalOpenCoaching = salesTeam.reduce((sum, s) => sum + (s.open_coaching || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Pantau performa tim sales kamu.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setCreateResult(null); setCreateError(''); }}
          className="btn-primary text-sm px-3 py-2"
        >
          + Anggota
        </button>
      </div>

      {/* Tambah Anggota Form */}
      {showForm && (
        <div className="card border border-blue-100 bg-blue-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tambah Anggota Tim</h3>

          {createResult ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-1">Akun berhasil dibuat!</p>
                <p className="text-xs text-green-700">Email: <span className="font-mono font-semibold">{createResult.email}</span></p>
                <p className="text-xs text-green-700 mt-1">Password sementara:</p>
                <p className="font-mono text-sm font-bold text-green-900 bg-green-100 rounded px-2 py-1 mt-1 select-all">
                  {createResult.temporary_password}
                </p>
                <p className="text-xs text-green-600 mt-1">Bagikan ke anggota. Mereka harus ganti password saat pertama login.</p>
              </div>
              <button
                onClick={() => { setCreateResult(null); setShowForm(false); }}
                className="btn-primary w-full py-2 text-sm"
              >
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-3">
              {createError && (
                <div className="p-2 bg-red-50 border border-red-100 rounded text-xs text-red-600">{createError}</div>
              )}
              <div>
                <label className="label text-xs">Nama</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nama lengkap"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label text-xs">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="email@perusahaan.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label text-xs">Role</label>
                <select
                  className="input"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="sales">Sales</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="btn-primary flex-1 py-2 text-sm">
                  {creating ? 'Membuat...' : 'Buat Akun'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg text-gray-600"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Quick Alerts */}
      {(totalPendingExt > 0 || totalOpenCoaching > 0) && (
        <div className="space-y-2">
          {totalPendingExt > 0 && (
            <Link href="/owner/extensions" className="card bg-yellow-50 border-yellow-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-800">⏰ {totalPendingExt} extension menunggu persetujuan</p>
                <p className="text-xs text-yellow-600">Tap untuk review</p>
              </div>
              <span className="text-yellow-600">→</span>
            </Link>
          )}
          {totalOpenCoaching > 0 && (
            <Link href="/owner/coaching" className="card bg-blue-50 border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">💬 {totalOpenCoaching} coaching request terbuka</p>
                <p className="text-xs text-blue-600">Tap untuk review</p>
              </div>
              <span className="text-blue-600">→</span>
            </Link>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><HealthDot health="green" /> Sehat</span>
        <span className="flex items-center gap-1"><HealthDot health="yellow" /> Perhatian</span>
        <span className="flex items-center gap-1"><HealthDot health="red" /> Intervensi</span>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : salesTeam.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">Belum ada data sales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salesTeam.map((sales) => {
            const flags = sales.latest_flags
              ? (typeof sales.latest_flags === 'string' ? JSON.parse(sales.latest_flags) : sales.latest_flags)
              : [];

            return (
              <Link key={sales.id} href={`/owner/sales/${sales.id}`}>
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-sm">
                          {sales.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sales.name}</p>
                        <p className="text-xs text-gray-500">{sales.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HealthDot health={sales.health} />
                      <span className={`text-xs font-medium ${sales.health === 'green' ? 'text-green-600' : sales.health === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {healthLabel(sales.health)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-lg font-bold ${sales.sla_on_time >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                        {sales.sla_on_time}%
                      </p>
                      <p className="text-xs text-gray-500">SLA</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-lg font-bold ${sales.meeting_count > 0 ? 'text-green-600' : 'text-yellow-500'}`}>
                        {sales.meeting_count}
                      </p>
                      <p className="text-xs text-gray-500">Meeting</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`text-lg font-bold ${sales.overdue_count === 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {sales.overdue_count}
                      </p>
                      <p className="text-xs text-gray-500">Overdue</p>
                    </div>
                  </div>

                  {/* Flags */}
                  {flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {flags.map((f) => (
                        <span key={f.code} className="badge-red text-xs">{f.label}</span>
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {sales.pending_extensions > 0 && (
                      <span className="badge-yellow">{sales.pending_extensions} ext pending</span>
                    )}
                    {sales.open_coaching > 0 && (
                      <span className="badge-blue">{sales.open_coaching} coaching</span>
                    )}
                    {sales.stagnant_accounts > 0 && (
                      <span className="badge-yellow">{sales.stagnant_accounts} stagnan</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
