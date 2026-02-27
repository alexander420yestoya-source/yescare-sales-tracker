'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateShort } from '../../../lib/utils';

const COUNTERS = [
  { key: 'account_progress', label: 'Progress Akun', icon: '📁', desc: 'Akun yang ada perkembangannya' },
  { key: 'stakeholder_interaction', label: 'Interaksi Stakeholder', icon: '🤝', desc: 'Kontak dengan decision maker' },
  { key: 'meeting_requested', label: 'Meeting Diminta', icon: '📅', desc: 'Request meeting yang dikirim' },
  { key: 'follow_up_done', label: 'Follow-up Dilakukan', icon: '📞', desc: 'Follow-up yang sudah dilakukan' },
  { key: 'preventive_shared', label: 'Insight Preventif', icon: '💡', desc: 'Insight yang dibagikan ke klien' },
];

function CounterField({ label, icon, desc, value, onChange }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-bold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center hover:bg-blue-200 active:bg-blue-300"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    account_progress: 0,
    stakeholder_interaction: 0,
    meeting_requested: 0,
    follow_up_done: 0,
    preventive_shared: 0,
    reflection_text: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [todayAct, hist] = await Promise.all([
        api.getTodayActivity(),
        api.getActivities(),
      ]);
      setToday(todayAct);
      setHistory(hist.slice(1)); // skip today

      if (todayAct) {
        setForm({
          account_progress: todayAct.account_progress,
          stakeholder_interaction: todayAct.stakeholder_interaction,
          meeting_requested: todayAct.meeting_requested,
          follow_up_done: todayAct.follow_up_done,
          preventive_shared: todayAct.preventive_shared,
          reflection_text: todayAct.reflection_text,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.reflection_text.trim()) {
      setError('Refleksi harian wajib diisi.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.submitActivity(form);
      setSuccess(true);
      await loadData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">Aktivitas Harian</h1>
        <p className="text-xs text-gray-500 mt-0.5">{todayStr} · Butuh &lt; 60 detik</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700 font-medium">
          ✅ Aktivitas tersimpan!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {COUNTERS.map((counter) => (
          <CounterField
            key={counter.key}
            {...counter}
            value={form[counter.key]}
            onChange={(val) => setForm({ ...form, [counter.key]: val })}
          />
        ))}

        {/* Reflection */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-900 mb-1">
            💭 Refleksi Harian <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Progress paling penting hari ini?</p>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Contoh: Berhasil konfirmasi jadwal meeting dengan Dinas Pendidikan..."
            value={form.reflection_text}
            onChange={(e) => setForm({ ...form, reflection_text: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : today ? 'Perbarui Aktivitas' : 'Simpan Aktivitas'}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Riwayat</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((act) => (
              <div key={act.id} className="card">
                <p className="text-xs text-gray-500 mb-1">{formatDateShort(act.date)}</p>
                <div className="flex gap-3 text-xs text-gray-600 flex-wrap">
                  <span>📁 {act.account_progress}</span>
                  <span>🤝 {act.stakeholder_interaction}</span>
                  <span>📅 {act.meeting_requested}</span>
                  <span>📞 {act.follow_up_done}</span>
                  <span>💡 {act.preventive_shared}</span>
                </div>
                <p className="text-xs text-gray-500 italic mt-1.5 line-clamp-2">
                  "{act.reflection_text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
