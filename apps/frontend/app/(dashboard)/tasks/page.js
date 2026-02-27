'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { statusLabel, statusClass, taskTypeLabel, timeRemaining, formatDate } from '../../../lib/utils';

const TASK_TYPES = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'meeting_request', label: 'Request Meeting' },
  { value: 'document_submission', label: 'Pengiriman Dokumen' },
  { value: 'preventive_check', label: 'Preventive Check' },
  { value: 'other', label: 'Lainnya' },
];

const EXTENSION_REASONS = [
  'Waiting client data',
  'Internal approval',
  'Scope revision',
  'Technical issue',
  'Other',
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showExtForm, setShowExtForm] = useState(null); // task id
  const [form, setForm] = useState({
    account_name: '',
    task_type: 'follow_up',
    title: '',
    deadline: defaultDeadline(),
  });
  const [extForm, setExtForm] = useState({ reason: 'Waiting client data', reason_detail: '', requested_deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  function defaultDeadline() {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  }

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createTask(form);
      setShowForm(false);
      setForm({ account_name: '', task_type: 'follow_up', title: '', deadline: defaultDeadline() });
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(id) {
    try {
      await api.completeTask(id);
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleExtension(taskId) {
    setError('');
    setSubmitting(true);
    try {
      await api.requestExtension({
        task_id: taskId,
        reason: extForm.reason,
        reason_detail: extForm.reason_detail,
        requested_deadline: extForm.requested_deadline,
      });
      setShowExtForm(null);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['completed'].includes(t.status);
    if (filter === 'overdue') return t.status === 'overdue';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-gray-900">Komitmen Harian</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm">
          {showForm ? 'Batal' : '+ Task Baru'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Form Buat Task */}
      {showForm && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Task Baru</h2>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label className="label">Nama Akun</label>
              <input className="input" placeholder="Contoh: PT Maju Bersama" value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Tipe Task</label>
              <select className="input" value={form.task_type}
                onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Judul Task</label>
              <input className="input" placeholder="Contoh: Kirim proposal sistem ERP" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Deadline (default 24 jam)</label>
              <input type="datetime-local" className="input" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5">
                {submitting ? 'Menyimpan...' : 'Simpan Task'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-4">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'active', label: 'Aktif' },
          { key: 'overdue', label: 'Terlambat' },
          { key: 'completed', label: 'Selesai' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">Belum ada task.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div key={task.id} className="card space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{task.account_name}</p>
                </div>
                <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge-gray">{taskTypeLabel(task.task_type)}</span>
                <span className={`text-xs ${task.status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {timeRemaining(task.deadline)}
                </span>
                {task.extension_count > 0 && (
                  <span className="badge-blue">{task.extension_count}x perpanjang</span>
                )}
              </div>

              {/* Actions */}
              {task.status !== 'completed' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => handleComplete(task.id)}
                    className="flex-1 btn-primary py-1.5 text-xs">
                    ✓ Selesai
                  </button>
                  {task.status !== 'overdue' && task.extension_count < 2 && (
                    <button
                      onClick={() => {
                        const newDeadline = new Date(task.deadline);
                        newDeadline.setHours(newDeadline.getHours() + 24);
                        setExtForm({
                          reason: 'Waiting client data',
                          reason_detail: '',
                          requested_deadline: newDeadline.toISOString().slice(0, 16),
                        });
                        setShowExtForm(task.id);
                      }}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      ⏰ Perpanjang
                    </button>
                  )}
                </div>
              )}

              {/* Extension Form */}
              {showExtForm === task.id && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Request Perpanjangan</p>
                  <div>
                    <label className="label text-xs">Alasan</label>
                    <select className="input text-sm" value={extForm.reason}
                      onChange={(e) => setExtForm({ ...extForm, reason: e.target.value })}>
                      {EXTENSION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  {extForm.reason === 'Other' && (
                    <input className="input text-sm" placeholder="Jelaskan alasan..." value={extForm.reason_detail}
                      onChange={(e) => setExtForm({ ...extForm, reason_detail: e.target.value })} />
                  )}
                  <div>
                    <label className="label text-xs">Deadline Baru</label>
                    <input type="datetime-local" className="input text-sm" value={extForm.requested_deadline}
                      onChange={(e) => setExtForm({ ...extForm, requested_deadline: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleExtension(task.id)} disabled={submitting}
                      className="btn-primary flex-1 py-1.5 text-xs">
                      {submitting ? 'Mengirim...' : 'Kirim Request'}
                    </button>
                    <button onClick={() => setShowExtForm(null)} className="btn-secondary py-1.5 px-3 text-xs">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Extension pending badge */}
              {task.extensions?.some((e) => e.status === 'pending') && (
                <div className="text-xs text-yellow-600 bg-yellow-50 rounded px-2 py-1">
                  ⏳ Menunggu persetujuan perpanjangan dari Owner
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
