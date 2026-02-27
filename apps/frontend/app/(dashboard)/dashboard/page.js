'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { getStoredUser } from '../../../lib/auth';
import { statusLabel, statusClass, taskTypeLabel, timeRemaining, formatDate } from '../../../lib/utils';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayActivity, setTodayActivity] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasks, activity, summary] = await Promise.all([
        api.getTodayTasks(),
        api.getTodayActivity(),
        api.getWeeklySummary(),
      ]);
      setTodayTasks(tasks);
      setTodayActivity(activity);
      setWeeklySummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const todayLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overdueCount = todayTasks.filter((t) => t.status === 'overdue').length;
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const flags = weeklySummary?.flags
    ? (typeof weeklySummary.flags === 'string' ? JSON.parse(weeklySummary.flags) : weeklySummary.flags)
    : [];

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-xs text-gray-500">{todayLabel}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">
          Halo, {user?.name?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Alert: belum ada task hari ini */}
      {todayTasks.length === 0 && (
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-sm font-semibold text-blue-800">Belum ada komitmen hari ini</p>
          <p className="text-xs text-blue-600 mt-0.5">Buat minimal 1 task untuk mulai hari ini.</p>
          <Link href="/tasks" className="btn-primary inline-block mt-3 text-xs py-1.5 px-3">
            + Buat Task
          </Link>
        </div>
      )}

      {/* Alert: belum isi aktivitas */}
      {!todayActivity && (
        <div className="card bg-yellow-50 border-yellow-100">
          <p className="text-sm font-semibold text-yellow-800">Aktivitas harian belum diisi</p>
          <p className="text-xs text-yellow-600 mt-0.5">Butuh kurang dari 60 detik.</p>
          <Link href="/activity" className="inline-block mt-3 text-xs py-1.5 px-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">
            Isi Sekarang
          </Link>
        </div>
      )}

      {/* Flag alert */}
      {flags.length > 0 && (
        <div className="card bg-orange-50 border-orange-100">
          <p className="text-sm font-semibold text-orange-800">⚠️ {flags.length} flag minggu ini</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {flags.map((f) => (
              <span key={f.code} className="badge-red">{f.label}</span>
            ))}
          </div>
          <Link href="/weekly" className="inline-block mt-2 text-xs text-orange-600 font-medium underline">
            Lihat detail →
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{todayTasks.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Task Hari Ini</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {overdueCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Terlambat</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-700">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Selesai</p>
        </div>
      </div>

      {/* Today Tasks */}
      {todayTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Task Hari Ini</h2>
            <Link href="/tasks" className="text-xs text-blue-600 font-medium">Semua →</Link>
          </div>
          <div className="space-y-2">
            {todayTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{task.account_name} · {taskTypeLabel(task.task_type)}</p>
                  </div>
                  <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{timeRemaining(task.deadline)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Score */}
      {weeklySummary && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Skor Minggu Ini</h2>
            <Link href="/weekly" className="text-xs text-blue-600 font-medium">Detail →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${weeklySummary.sla_on_time_percentage >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                {weeklySummary.sla_on_time_percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">SLA On-Time</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold ${weeklySummary.meeting_count > 0 ? 'text-green-600' : 'text-yellow-500'}`}>
                {weeklySummary.meeting_count}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Meeting Diminta</p>
            </div>
          </div>
        </div>
      )}

      {/* Today Activity (if done) */}
      {todayActivity && (
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm font-semibold text-green-800">✅ Aktivitas hari ini sudah diisi</p>
          <p className="text-xs text-green-600 italic mt-1">"{todayActivity.reflection_text}"</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pb-2">
        <Link href="/tasks" className="card flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Buat Task</p>
            <p className="text-xs text-gray-500">Tulis komitmen baru</p>
          </div>
        </Link>
        <Link href="/coaching" className="card flex items-center gap-3 hover:bg-gray-50 transition-colors">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-sm font-medium text-gray-900">Minta Coaching</p>
            <p className="text-xs text-gray-500">Tanda inisiatif</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
