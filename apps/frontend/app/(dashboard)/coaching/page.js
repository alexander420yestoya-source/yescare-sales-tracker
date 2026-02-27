'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

const REASONS = [
  { value: 'Objection handling', label: 'Objection Handling', desc: 'Cara menghadapi penolakan klien', icon: '🛡️' },
  { value: 'Budget issue', label: 'Budget Issue', desc: 'Klien terkendala anggaran', icon: '💰' },
  { value: 'Stakeholder access', label: 'Akses Stakeholder', desc: 'Sulit menjangkau decision maker', icon: '🎯' },
  { value: 'Proposal structuring', label: 'Struktur Proposal', desc: 'Cara menulis proposal yang kuat', icon: '📋' },
  { value: 'SLA issue', label: 'Masalah SLA', desc: 'Kesulitan memenuhi deadline', icon: '⏰' },
];

export default function CoachingPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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

  async function handleSubmit() {
    if (!selected) {
      setError('Pilih topik coaching terlebih dahulu.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.submitCoaching(selected);
      setSuccess(true);
      setShowForm(false);
      setSelected('');
      await loadRequests();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Coaching Request</h1>
        <p className="text-xs text-gray-500 mt-0.5">Minta bantuan adalah tanda profesionalisme.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium">
          💬 Coaching request terkirim! Owner akan follow up secepatnya.
        </div>
      )}

      {/* CTA Card */}
      {!showForm && (
        <div className="card bg-blue-50 border-blue-100 text-center py-5">
          <p className="text-3xl mb-2">💬</p>
          <h2 className="text-sm font-semibold text-blue-900 mb-1">Butuh bantuan?</h2>
          <p className="text-xs text-blue-600 mb-4">
            Request coaching adalah <strong>inisiatif positif</strong>, bukan tanda kelemahan.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-6">
            Minta Coaching Sekarang
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Pilih Topik</h2>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelected(r.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                  selected === r.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
                {selected === r.value && (
                  <span className="ml-auto text-blue-600 text-lg">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || !selected}
              className="btn-primary flex-1 py-2.5"
            >
              {submitting ? 'Mengirim...' : 'Kirim Request'}
            </button>
            <button onClick={() => { setShowForm(false); setSelected(''); }} className="btn-secondary py-2.5 px-4">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Riwayat</h2>
          <div className="space-y-2">
            {requests.map((req) => {
              const reason = REASONS.find((r) => r.value === req.reason);
              return (
                <div key={req.id} className="card flex items-center gap-3">
                  <span className="text-xl">{reason?.icon || '💬'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{req.reason}</p>
                    <p className="text-xs text-gray-400">{formatDate(req.created_at)}</p>
                  </div>
                  <span className={req.status === 'open' ? 'badge-blue' : 'badge-gray'}>
                    {req.status === 'open' ? 'Menunggu' : 'Selesai'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card text-center py-6">
          <p className="text-gray-400 text-sm">Belum ada coaching request.</p>
        </div>
      )}
    </div>
  );
}
