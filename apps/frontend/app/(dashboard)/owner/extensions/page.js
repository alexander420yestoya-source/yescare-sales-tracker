'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { formatDate, taskTypeLabel } from '../../../../lib/utils';

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadExtensions(); }, []);

  async function loadExtensions() {
    try {
      const data = await api.getPendingExtensions();
      setExtensions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handle(id, action) {
    setProcessing(id + action);
    try {
      if (action === 'approve') {
        await api.approveExtension(id);
      } else {
        await api.rejectExtension(id);
      }
      await loadExtensions();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Extension Requests</h1>
        <p className="text-xs text-gray-500 mt-0.5">Perpanjangan deadline menunggu persetujuan.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : extensions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-gray-600 font-medium text-sm">Tidak ada extension yang perlu diproses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {extensions.map((ext) => (
            <div key={ext.id} className="card space-y-3">
              {/* Task Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 text-xs font-bold">
                      {ext.task?.user?.name?.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{ext.task?.user?.name}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{ext.task?.title}</p>
                <p className="text-xs text-gray-500">{ext.task?.account_name} · {taskTypeLabel(ext.task?.task_type)}</p>
              </div>

              {/* Extension Details */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Alasan</span>
                  <span className="font-medium text-gray-900">{ext.reason}</span>
                </div>
                {ext.reason_detail && (
                  <div className="flex justify-between">
                    <span>Detail</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{ext.reason_detail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Deadline Asli</span>
                  <span className="font-medium text-gray-900">{formatDate(ext.task?.deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline Baru</span>
                  <span className="font-medium text-blue-700">{formatDate(ext.requested_deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diminta</span>
                  <span className="font-medium text-gray-900">{formatDate(ext.requested_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handle(ext.id, 'approve')}
                  disabled={!!processing}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  {processing === ext.id + 'approve' ? 'Memproses...' : '✓ Setujui'}
                </button>
                <button
                  onClick={() => handle(ext.id, 'reject')}
                  disabled={!!processing}
                  className="btn-danger flex-1 py-2.5 text-sm"
                >
                  {processing === ext.id + 'reject' ? 'Memproses...' : '✕ Tolak'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
