const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { generateWeeklySummary } = require('../services/weeklyEngine');

const prisma = new PrismaClient();

/**
 * Jalankan weekly summary generation untuk semua sales users.
 * Dijadwalkan setiap Jumat pukul 18:00 WIB (UTC+7 = 11:00 UTC).
 */
async function runWeeklySummaryForAll() {
  console.log('⏰ Menjalankan weekly summary generation...');

  try {
    const salesUsers = await prisma.user.findMany({ where: { role: 'sales' } });

    for (const user of salesUsers) {
      try {
        await generateWeeklySummary(user.id);
        console.log(`  ✅ Summary dibuat untuk: ${user.name}`);
      } catch (err) {
        console.error(`  ❌ Gagal untuk ${user.name}:`, err.message);
      }
    }

    console.log('✅ Weekly summary selesai.');
  } catch (err) {
    console.error('❌ Gagal menjalankan weekly job:', err.message);
  }
}

/**
 * Sync status task aktif setiap 30 menit.
 */
async function syncTaskStatuses() {
  const { computeTaskStatus } = require('../services/taskStatus');
  try {
    const activeTasks = await prisma.task.findMany({
      where: { status: { notIn: ['completed'] } },
    });

    for (const task of activeTasks) {
      const liveStatus = computeTaskStatus(task);
      if (liveStatus !== task.status) {
        await prisma.task.update({ where: { id: task.id }, data: { status: liveStatus } });
      }
    }
  } catch (err) {
    console.error('❌ Gagal sync task status:', err.message);
  }
}

function startCronJobs() {
  // Weekly summary — setiap Jumat jam 18:00 WIB (11:00 UTC)
  cron.schedule('0 11 * * 5', () => {
    runWeeklySummaryForAll();
  });

  // Sync task status — setiap 30 menit
  cron.schedule('*/30 * * * *', () => {
    syncTaskStatuses();
  });

  console.log('⏰ Cron jobs aktif: weekly summary (Jumat 18:00) + task sync (setiap 30 menit)');
}

module.exports = { startCronJobs, runWeeklySummaryForAll };
