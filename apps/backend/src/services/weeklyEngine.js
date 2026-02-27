const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * MICRO LESSONS — konten hardcoded per flag
 */
const MICRO_LESSONS = {
  TIME_DISCIPLINE_RISK: {
    title: 'Cara Membuat SLA yang Realistis',
    points: [
      'Estimasi waktu selalu tambah 30% buffer dari perkiraan awal.',
      'Prioritaskan task berdasarkan dampak, bukan urutan masuk.',
      'Kalau ada hambatan, komunikasikan lebih awal — jangan tunggu deadline.',
    ],
    action: 'Pilih 1 task minggu ini dan buat estimasi waktu yang lebih jujur.',
  },
  LOW_INITIATIVE_RISK: {
    title: 'Cara Minta Meeting B2B Tanpa Tekanan',
    points: [
      'Tawarkan nilai konkret dulu sebelum minta jadwal meeting.',
      'Gunakan kalimat: "Saya punya insight relevan untuk [masalah mereka], bisa 15 menit?"',
      'Pilih waktu yang tidak biasa (Selasa pagi, Kamis sore) — lebih mudah dapat slot.',
    ],
    action: 'Kirim 1 pesan meeting request hari ini dengan value proposition yang jelas.',
  },
  PIPELINE_STAGNATION: {
    title: 'Dasar Stakeholder Mapping',
    points: [
      'Identifikasi siapa decision maker, influencer, dan blocker di akun stagnan.',
      'Pendekatan influencer lebih dulu kalau tidak bisa langsung ke decision maker.',
      'Cari trigger event: pergantian jabatan, budget baru, masalah yang muncul.',
    ],
    action: 'Pilih 1 akun stagnan dan buat peta 3 stakeholder kuncinya hari ini.',
  },
  OVERCOMMITMENT: {
    title: 'Manajemen Komitmen yang Sehat',
    points: [
      'Sebelum commit, tanya diri: "Apakah ini realistis dengan beban kerja saat ini?"',
      'Lebih baik under-promise dan over-deliver daripada sebaliknya.',
      'Kalau sudah kelebihan beban, eskalasi ke owner — itu tanda profesionalisme.',
    ],
    action: 'Review semua task aktif dan identifikasi 1 yang bisa didelegasikan atau ditunda.',
  },
  REACTIVE_SELLING: {
    title: 'Preventive Positioning dalam B2B',
    points: [
      'Hubungi klien sebelum mereka menghubungi kamu dengan masalah.',
      'Bagikan insight industri atau regulasi yang relevan sebagai value add.',
      'Tanyakan: "Ada tantangan baru yang belum kita bahas?" — ini membuka peluang.',
    ],
    action: 'Kirim 1 preventive insight ke klien aktif hari ini.',
  },
};

/**
 * Generate weekly summary untuk satu user.
 */
async function generateWeeklySummary(userId) {
  const now = new Date();

  // Hitung Senin minggu ini
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Tasks minggu ini
  const weekTasks = await prisma.task.findMany({
    where: {
      user_id: userId,
      created_at: { gte: monday, lt: nextMonday },
    },
  });

  const totalTasks = weekTasks.length;
  const completedOnTime = weekTasks.filter(
    (t) => t.status === 'completed' && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline)
  ).length;
  const overdueCount = weekTasks.filter((t) => t.status === 'overdue').length;

  // SLA on-time %
  const slaOnTime = totalTasks > 0 ? Math.round((completedOnTime / totalTasks) * 100) : 100;

  // Extension count minggu ini
  const extensionCount = weekTasks.reduce((sum, t) => sum + t.extension_count, 0);

  // Daily activities minggu ini
  const activities = await prisma.dailyActivity.findMany({
    where: {
      user_id: userId,
      date: { gte: monday, lt: nextMonday },
    },
  });

  const meetingCount = activities.reduce((sum, a) => sum + a.meeting_requested, 0);
  const preventiveCount = activities.reduce((sum, a) => sum + a.preventive_shared, 0);

  // Akun stagnan: tidak ada aktivitas >14 hari
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const allTasks = await prisma.task.findMany({ where: { user_id: userId } });
  const recentAccounts = new Set(
    (await prisma.task.findMany({
      where: { user_id: userId, created_at: { gte: fourteenDaysAgo } },
    })).map((t) => t.account_name)
  );
  const allAccounts = new Set(allTasks.map((t) => t.account_name));
  const stagnantCount = [...allAccounts].filter((acc) => !recentAccounts.has(acc)).length;

  // RULE-BASED FLAG DETECTION
  const flags = [];

  if (slaOnTime < 80) {
    flags.push({ code: 'TIME_DISCIPLINE_RISK', label: 'Risiko Disiplin Waktu' });
  }
  if (meetingCount === 0) {
    flags.push({ code: 'LOW_INITIATIVE_RISK', label: 'Risiko Inisiatif Rendah' });
  }
  if (stagnantCount > 0) {
    flags.push({ code: 'PIPELINE_STAGNATION', label: 'Pipeline Stagnan' });
  }
  if (extensionCount > 3) {
    flags.push({ code: 'OVERCOMMITMENT', label: 'Pola Over-Komitmen' });
  }
  if (preventiveCount === 0) {
    // Cek 14 hari terakhir untuk preventive
    const prevActivities = await prisma.dailyActivity.findMany({
      where: { user_id: userId, date: { gte: fourteenDaysAgo } },
    });
    const totalPreventive = prevActivities.reduce((sum, a) => sum + a.preventive_shared, 0);
    if (totalPreventive === 0) {
      flags.push({ code: 'REACTIVE_SELLING', label: 'Pola Penjualan Reaktif' });
    }
  }

  // Upsert summary
  const summary = await prisma.weeklySummary.upsert({
    where: { user_id_week_start: { user_id: userId, week_start: monday } },
    update: {
      sla_on_time_percentage: slaOnTime,
      meeting_count: meetingCount,
      overdue_count: overdueCount,
      extension_count: extensionCount,
      stagnant_account_count: stagnantCount,
      preventive_count: preventiveCount,
      flags: JSON.stringify(flags),
    },
    create: {
      user_id: userId,
      week_start: monday,
      sla_on_time_percentage: slaOnTime,
      meeting_count: meetingCount,
      overdue_count: overdueCount,
      extension_count: extensionCount,
      stagnant_account_count: stagnantCount,
      preventive_count: preventiveCount,
      flags: JSON.stringify(flags),
    },
  });

  return summary;
}

/**
 * Ambil micro lessons berdasarkan flags.
 */
function getMicroLessons(flags) {
  if (!flags || flags.length === 0) return [];
  return flags
    .map((f) => {
      const lesson = MICRO_LESSONS[f.code];
      if (!lesson) return null;
      return { flag: f, lesson };
    })
    .filter(Boolean);
}

module.exports = { generateWeeklySummary, getMicroLessons, MICRO_LESSONS };
