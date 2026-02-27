'use client';
import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { formatDateShort } from '../../../lib/utils';

const MICRO_LESSONS = {
  TIME_DISCIPLINE_RISK: {
    title: 'Cara Membuat SLA yang Realistis',
    icon: '⏰',
    points: [
      'Estimasi waktu selalu tambah 30% buffer dari perkiraan awal.',
      'Prioritaskan task berdasarkan dampak, bukan urutan masuk.',
      'Kalau ada hambatan, komunikasikan lebih awal — jangan tunggu deadline.',
    ],
    action: 'Pilih 1 task minggu ini dan buat estimasi waktu yang lebih jujur.',
  },
  LOW_INITIATIVE_RISK: {
    title: 'Cara Minta Meeting B2B Tanpa Tekanan',
    icon: '📅',
    points: [
      'Tawarkan nilai konkret dulu sebelum minta jadwal meeting.',
      'Gunakan kalimat: "Saya punya insight relevan untuk [masalah mereka], bisa 15 menit?"',
      'Pilih waktu yang tidak biasa (Selasa pagi, Kamis sore) — lebih mudah dapat slot.',
    ],
    action: 'Kirim 1 pesan meeting request hari ini dengan value proposition yang jelas.',
  },
  PIPELINE_STAGNATION: {
    title: 'Dasar Stakeholder Mapping',
    icon: '🗺️',
    points: [
      'Identifikasi siapa decision maker, influencer, dan blocker di akun stagnan.',
      'Pendekatan influencer lebih dulu kalau tidak bisa langsung ke decision maker.',
      'Cari trigger event: pergantian jabatan, budget baru, masalah yang muncul.',
    ],
    action: 'Pilih 1 akun stagnan dan buat peta 3 stakeholder kuncinya hari ini.',
  },
  OVERCOMMITMENT: {
    title: 'Manajemen Komitmen yang Sehat',
    icon: '⚖️',
    points: [
      'Sebelum commit, tanya diri: "Apakah ini realistis dengan beban kerja saat ini?"',
      'Lebih baik under-promise dan over-deliver daripada sebaliknya.',
      'Kalau sudah kelebihan beban, eskalasi ke owner — itu tanda profesionalisme.',
    ],
    action: 'Review semua task aktif dan identifikasi 1 yang bisa didelegasikan atau ditunda.',
  },
  REACTIVE_SELLING: {
    title: 'Preventive Positioning dalam B2B',
    icon: '🛡️',
    points: [
      'Hubungi klien sebelum mereka menghubungi kamu dengan masalah.',
      'Bagikan insight industri atau regulasi yang relevan sebagai value add.',
      'Tanyakan: "Ada tantangan baru yang belum kita bahas?" — ini membuka peluang.',
    ],
    action: 'Kirim 1 preventive insight ke klien aktif hari ini.',
  },
};

function SummaryCard({ label, value, unit, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}{unit}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function WeeklyPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    try {
      const data = await api.getWeeklySummary();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      await api.generateWeeklySummary();
      await loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const flags = summary?.flags
    ? (typeof summary.flags === 'string' ? JSON.parse(summary.flags) : summary.flags)
    : [];

  const lessons = flags.map((f) => ({
    flag: f,
    lesson: MICRO_LESSONS[f.code],
  })).filter((l) => l.lesson);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ringkasan Mingguan</h1>
          {summary && (
            <p className="text-xs text-gray-500 mt-0.5">
              Minggu {formatDateShort(summary.week_start)}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-secondary py-2 px-3 text-xs"
        >
          {generating ? 'Memproses...' : '🔄 Update'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {!summary ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm mb-3">Belum ada data mingguan.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary py-2 px-4 text-sm">
            {generating ? 'Memproses...' : 'Generate Sekarang'}
          </button>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Metrik Minggu Ini</h2>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                label="SLA On-Time"
                value={summary.sla_on_time_percentage}
                unit="%"
                color={summary.sla_on_time_percentage >= 80 ? 'text-green-600' : 'text-red-500'}
              />
              <SummaryCard
                label="Meeting Diminta"
                value={summary.meeting_count}
                unit=""
                color={summary.meeting_count > 0 ? 'text-green-600' : 'text-yellow-500'}
              />
              <SummaryCard
                label="Task Terlambat"
                value={summary.overdue_count}
                unit=""
                color={summary.overdue_count === 0 ? 'text-green-600' : 'text-red-500'}
              />
              <SummaryCard
                label="Total Perpanjangan"
                value={summary.extension_count}
                unit=""
                color={summary.extension_count <= 3 ? 'text-gray-700' : 'text-orange-500'}
              />
              <SummaryCard
                label="Akun Stagnan"
                value={summary.stagnant_account_count}
                unit=""
                color={summary.stagnant_account_count === 0 ? 'text-green-600' : 'text-yellow-500'}
              />
              <SummaryCard
                label="Aksi Preventif"
                value={summary.preventive_count}
                unit=""
                color={summary.preventive_count > 0 ? 'text-green-600' : 'text-yellow-500'}
              />
            </div>
          </div>

          {/* Flags */}
          {flags.length > 0 ? (
            <div className="card bg-orange-50 border-orange-100">
              <h2 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Pola yang Terdeteksi</h2>
              <div className="space-y-1">
                {flags.map((f) => (
                  <div key={f.code} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-sm text-orange-700">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card bg-green-50 border-green-100 text-center py-4">
              <p className="text-green-700 font-semibold">✅ Tidak ada flag minggu ini!</p>
              <p className="text-xs text-green-600 mt-1">Kerja bagus, pertahankan!</p>
            </div>
          )}

          {/* Micro Lessons */}
          {lessons.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">📚 Micro Lesson</h2>
              {lessons.map(({ flag, lesson }) => (
                <div key={flag.code} className="card border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{lesson.icon}</span>
                    <h3 className="text-sm font-semibold text-gray-900">{lesson.title}</h3>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {lesson.points.map((point, i) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-blue-50 rounded-lg p-2.5">
                    <p className="text-xs text-blue-700 font-medium">
                      🎯 Action Step: {lesson.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
