const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hapus data lama
  await prisma.coachingRequest.deleteMany();
  await prisma.weeklySummary.deleteMany();
  await prisma.dailyActivity.deleteMany();
  await prisma.extensionRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Buat owner
  const owner = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'owner@yescare.com',
      password_hash: passwordHash,
      role: 'owner',
    },
  });

  // Buat 2 sales
  const sales1 = await prisma.user.create({
    data: {
      name: 'Andi Wijaya',
      email: 'andi@yescare.com',
      password_hash: passwordHash,
      role: 'sales',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Sari Dewi',
      email: 'sari@yescare.com',
      password_hash: passwordHash,
      role: 'sales',
    },
  });

  // Buat tasks untuk sales1
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const task1 = await prisma.task.create({
    data: {
      user_id: sales1.id,
      account_name: 'PT Maju Bersama',
      task_type: 'proposal',
      title: 'Kirim proposal sistem ERP',
      deadline: tomorrow,
      status: 'on_track',
    },
  });

  const task2 = await prisma.task.create({
    data: {
      user_id: sales1.id,
      account_name: 'CV Teknologi Nusantara',
      task_type: 'follow_up',
      title: 'Follow up keputusan pengadaan',
      deadline: yesterday,
      status: 'overdue',
    },
  });

  const task3 = await prisma.task.create({
    data: {
      user_id: sales1.id,
      account_name: 'Dinas Pendidikan Kota',
      task_type: 'meeting_request',
      title: 'Request meeting dengan Kepala Dinas',
      deadline: twoWeeksAgo,
      status: 'completed',
      completed_at: twoWeeksAgo,
    },
  });

  // Extension request untuk task2
  await prisma.extensionRequest.create({
    data: {
      task_id: task2.id,
      reason: 'Waiting client data',
      requested_deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      status: 'pending',
    },
  });

  // Tasks untuk sales2
  await prisma.task.create({
    data: {
      user_id: sales2.id,
      account_name: 'PT Solusi Digital',
      task_type: 'document_submission',
      title: 'Submit dokumen TKDN',
      deadline: tomorrow,
      status: 'on_track',
    },
  });

  await prisma.task.create({
    data: {
      user_id: sales2.id,
      account_name: 'Kementerian Kominfo',
      task_type: 'preventive_check',
      title: 'Preventive check kepuasan klien',
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'on_track',
    },
  });

  // Daily activities
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyActivity.create({
    data: {
      user_id: sales1.id,
      date: today,
      account_progress: 3,
      stakeholder_interaction: 2,
      meeting_requested: 1,
      follow_up_done: 2,
      preventive_shared: 1,
      reflection_text: 'Berhasil konfirmasi jadwal meeting dengan Dinas Pendidikan',
    },
  });

  await prisma.dailyActivity.create({
    data: {
      user_id: sales2.id,
      date: today,
      account_progress: 2,
      stakeholder_interaction: 3,
      meeting_requested: 0,
      follow_up_done: 1,
      preventive_shared: 0,
      reflection_text: 'Dokumen TKDN sudah 80% lengkap, tinggal tanda tangan direktur',
    },
  });

  // Weekly summaries
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - now.getDay() + 1);
  lastMonday.setHours(0, 0, 0, 0);

  await prisma.weeklySummary.create({
    data: {
      user_id: sales1.id,
      week_start: lastMonday,
      sla_on_time_percentage: 75,
      meeting_count: 2,
      overdue_count: 1,
      extension_count: 1,
      stagnant_account_count: 1,
      preventive_count: 2,
      flags: JSON.stringify([
        { code: 'TIME_DISCIPLINE_RISK', label: 'Risiko Disiplin Waktu' }
      ]),
    },
  });

  await prisma.weeklySummary.create({
    data: {
      user_id: sales2.id,
      week_start: lastMonday,
      sla_on_time_percentage: 90,
      meeting_count: 0,
      overdue_count: 0,
      extension_count: 0,
      stagnant_account_count: 0,
      preventive_count: 0,
      flags: JSON.stringify([
        { code: 'LOW_INITIATIVE_RISK', label: 'Risiko Inisiatif Rendah' },
        { code: 'REACTIVE_SELLING', label: 'Pola Penjualan Reaktif' }
      ]),
    },
  });

  // Coaching requests
  await prisma.coachingRequest.create({
    data: {
      user_id: sales1.id,
      reason: 'Objection handling',
      status: 'open',
    },
  });

  console.log('✅ Seed selesai!');
  console.log('');
  console.log('Akun tersedia:');
  console.log('  Owner  : owner@yescare.com / password123');
  console.log('  Sales 1: andi@yescare.com / password123');
  console.log('  Sales 2: sari@yescare.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
