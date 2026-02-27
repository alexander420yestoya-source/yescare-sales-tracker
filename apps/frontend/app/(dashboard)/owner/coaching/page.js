'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { formatDate } from '../../../../lib/utils';

const REASON_ICONS = {
  'Objection handling': '🛡️',
  'Budget issue': '💰',
  'Stakeholder access': '🎯',
  'Proposal structuring': '📋',
  'SLA issue': '⏰',
};

export default function OwnerCoachingPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    try {
      const data = await api.getCoachingRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(id) {
    setClosing(id);
    try {
      await api.closeCoaching(id);
      await loadRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setClosing(null);
    }
  }

  const open = requests.filter((r) => r.status === 'open');
  const closed = requests.filter((r) => r.status === 'closed');

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Coaching Requests</h1>
        <p className="text-xs text-gray-500 mt-0.5">Inisiatif positif dari tim sales kamu.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Open Requests */}
          {open.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Menunggu <span className="badge-blue ml-1">{open.length}</span>
              </h2>
              <div className="space-y-2">
                {open.map((req) => (
                  <div key={req.id} className="card bg-blue-50 border-blue-100">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{REASON_ICONS[req.reason] || '💬'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{req.user?.name}</p>
                          <span className="badge-blue text-xs">Menunggu</span>
                        </div>
                        <p className="text-sm text-blue-800">{req.reason}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(req.created_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClose(req.id)}
                      disabled={closing === req.id}
                      className="mt-3 btn-primary w-full py-2 text-xs"
                    >
                      {closing === req.id ? 'Memproses...' : '✓ Tandai Selesai'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-6">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-600 font-medium">Tidak ada coaching request terbuka.</p>
            </div>
          )}

          {/* Closed */}
          {closed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">Selesai</h2>
              <div className="space-y-2">
                {closed.slice(0, 5).map((req) => (
                  <div key={req.id} className="card flex items-center gap-3 opacity-60">
                    <span className="text-xl">{REASON_ICONS[req.reason] || '💬'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{req.user?.name}</p>
                      <p className="text-xs text-gray-500">{req.reason}</p>
                    </div>
                    <span className="badge-gray">Selesai</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
