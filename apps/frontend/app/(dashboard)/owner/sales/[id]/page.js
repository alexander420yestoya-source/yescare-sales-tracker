'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { statusLabel, statusClass, taskTypeLabel, formatDateShort } from '../../../../../lib/utils';

const MICRO_LESSONS = {
  TIME_DISCIPLINE_RISK: { icon: '⏰', label: 'Risiko Disiplin Waktu' },
  LOW_INITIATIVE_RISK: { icon: '📅', label: 'Risiko Inisiatif Rendah' },
  PIPELINE_STAGNATION: { icon: '🗺️', label: 'Pipeline Stagnan' },
  OVERCOMMITMENT: { icon: '⚖️', label: 'Pola Over-Komitmen' },
  REACTIVE_SELLING: { icon: '🛡️', label: 'Pola Penjualan Reaktif' },
};

export default function SalesDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    try {
      const res = await api.getSalesDetail(id);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="card bg-red-50 border-red-100 text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  const { user, tasks, summaries, coaching_requests } = data;
  const latestSummary = summaries?.[0];
  const flags = latestSummary?.flags
    ? (typeof latestSummary.flags === 'string' ? JSON.parse(latestSummary.flags) : latestSummary.flags)
    : [];

  return (
    <div className="p-4 space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
          ← Kembali
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-700 font-bold text-xl">{user.name.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{user.name}</h1>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Weekly Summary */}
      {latestSummary && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Performa Minggu Ini
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'SLA', value: `${latestSummary.sla_on_time_percentage}%`, good: latestSummary.sla_on_time_percentage >= 80 },
              { label: 'Meeting', value: latestSummary.meeting_count, good: latestSummary.meeting_count > 0 },
              { label: 'Overdue', value: latestSummary.overdue_count, good: latestSummary.overdue_count === 0 },
              { label: 'Extension', value: latestSummary.extension_count, good: latestSummary.extension_count <= 2 },
              { label: 'Stagnan', value: latestSummary.stagnant_account_count, good: latestSummary.stagnant_account_count === 0 },
              { label: 'Preventif', value: latestSummary.preventive_count, good: latestSummary.preventive_count > 0 },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className={`text-lg font-bold ${m.good ? 'text-green-600' : 'text-red-500'}`}>{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {flags.map((f) => {
                const meta = MICRO_LESSONS[f.code];
                return (
                  <span key={f.code} className="badge-red">
                    {meta?.icon} {f.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Task Terbaru</h2>
        {tasks.length === 0 ? (
          <div className="card text-center py-4">
            <p className="text-xs text-gray-400">Belum ada task.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.account_name} · {taskTypeLabel(task.task_type)}</p>
                  </div>
                  <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDateShort(task.deadline)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coaching */}
      {coaching_requests?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Coaching Requests</h2>
          <div className="space-y-2">
            {coaching_requests.map((req) => (
              <div key={req.id} className="card flex items-center gap-3">
                <span className="text-lg">💬</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{req.reason}</p>
                  <p className="text-xs text-gray-400">{formatDateShort(req.created_at)}</p>
                </div>
                <span className={req.status === 'open' ? 'badge-blue' : 'badge-gray'}>
                  {req.status === 'open' ? 'Terbuka' : 'Selesai'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-Day Trend */}
      {summaries?.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Tren 30 Hari</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2">Minggu</th>
                  <th className="text-center pb-2">SLA</th>
                  <th className="text-center pb-2">Meeting</th>
                  <th className="text-center pb-2">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-1.5">{formatDateShort(s.week_start)}</td>
                    <td className={`text-center font-medium ${s.sla_on_time_percentage >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                      {s.sla_on_time_percentage}%
                    </td>
                    <td className="text-center">{s.meeting_count}</td>
                    <td className={`text-center font-medium ${s.overdue_count === 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {s.overdue_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
