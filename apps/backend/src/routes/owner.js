const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/owner/users — owner buat akun anggota tim baru
router.post('/users', authMiddleware, ownerOnly, async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nama dan email wajib diisi.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan.' });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 chars
    const hash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hash,
        role: role === 'owner' ? 'owner' : 'sales',
        must_change_password: true,
      },
    });

    res.status(201).json({
      message: 'Akun berhasil dibuat.',
      email: user.email,
      temporary_password: tempPassword,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat akun.', detail: err.message });
  }
});

// PATCH /api/owner/users/:id — edit nama/email/role anggota
router.patch('/users/:id', authMiddleware, ownerOnly, async (req, res) => {
  const { name, email, role } = req.body;

  if (!name && !email && !role) {
    return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

    if (email && email !== target.email) {
      const emailUsed = await prisma.user.findUnique({ where: { email } });
      if (emailUsed) return res.status(400).json({ error: 'Email sudah digunakan.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role === 'owner' ? 'owner' : 'sales' }),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ message: 'Data anggota diperbarui.', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui data.', detail: err.message });
  }
});

// PATCH /api/owner/users/:id/reset-password — reset password anggota
router.patch('/users/:id/reset-password', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password_hash: hash, must_change_password: true },
    });

    res.json({
      message: 'Password berhasil direset.',
      email: target.email,
      temporary_password: tempPassword,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal reset password.', detail: err.message });
  }
});

// DELETE /api/owner/users/:id — hapus anggota
router.delete('/users/:id', authMiddleware, ownerOnly, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

    // Hapus semua data relasi secara manual dalam transaksi (urutan penting)
    await prisma.$transaction([
      // 1. Null-out approved_by jika user ini pernah approve extension orang lain
      prisma.extensionRequest.updateMany({
        where: { approved_by: req.params.id },
        data: { approved_by: null },
      }),
      // 2. Hapus extension requests dari task milik user ini
      prisma.extensionRequest.deleteMany({
        where: { task: { user_id: req.params.id } },
      }),
      // 3. Hapus semua task
      prisma.task.deleteMany({ where: { user_id: req.params.id } }),
      // 4. Hapus daily activities
      prisma.dailyActivity.deleteMany({ where: { user_id: req.params.id } }),
      // 5. Hapus weekly summaries
      prisma.weeklySummary.deleteMany({ where: { user_id: req.params.id } }),
      // 6. Hapus coaching requests
      prisma.coachingRequest.deleteMany({ where: { user_id: req.params.id } }),
      // 7. Hapus user
      prisma.user.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ message: 'User dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus user.', detail: err.message });
  }
});

// GET /api/owner/sales — daftar semua sales dengan ringkasan
router.get('/sales', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const salesUsers = await prisma.user.findMany({
      where: { role: 'sales' },
      select: { id: true, name: true, email: true },
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const result = await Promise.all(salesUsers.map(async (user) => {
      // Tasks 30 hari terakhir
      const tasks = await prisma.task.findMany({
        where: { user_id: user.id, created_at: { gte: thirtyDaysAgo } },
      });

      const totalTasks = tasks.length;
      const completedOnTime = tasks.filter(
        (t) => t.status === 'completed' && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline)
      ).length;
      const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
      const slaOnTime = totalTasks > 0 ? Math.round((completedOnTime / totalTasks) * 100) : 100;
      const recentExtensions = tasks.reduce((sum, t) => sum + t.extension_count, 0);

      // Activities 7 hari
      const activities = await prisma.dailyActivity.findMany({
        where: { user_id: user.id, date: { gte: sevenDaysAgo } },
      });
      const meetingCount = activities.reduce((sum, a) => sum + a.meeting_requested, 0);

      // Akun stagnan — optimized: only fetch account_name, use distinct
      const allAccountNames = await prisma.task.findMany({
        where: { user_id: user.id },
        select: { account_name: true },
        distinct: ['account_name'],
      });
      const recentAccountNames = await prisma.task.findMany({
        where: { user_id: user.id, created_at: { gte: fourteenDaysAgo } },
        select: { account_name: true },
        distinct: ['account_name'],
      });
      const recentSet = new Set(recentAccountNames.map((t) => t.account_name));
      const stagnantCount = allAccountNames.filter((t) => !recentSet.has(t.account_name)).length;

      // Coaching open
      const openCoaching = await prisma.coachingRequest.count({
        where: { user_id: user.id, status: 'open' },
      });

      // Extension pending
      const pendingExtensions = await prisma.extensionRequest.count({
        where: { task: { user_id: user.id }, status: 'pending' },
      });

      // Weekly summary terbaru
      const latestSummary = await prisma.weeklySummary.findFirst({
        where: { user_id: user.id },
        orderBy: { week_start: 'desc' },
      });

      // Inactivity detection
      const latestTask = await prisma.task.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      });
      const latestActivity = await prisma.dailyActivity.findFirst({
        where: { user_id: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      const noRecentTask = !latestTask || new Date(latestTask.created_at) < threeDaysAgo;
      const noRecentActivity = !latestActivity || new Date(latestActivity.date) < twoDaysAgo;
      const is_inactive = noRecentTask || noRecentActivity;

      // Health score
      let health = 'green';
      if (is_inactive || slaOnTime < 80 || overdueCount > 2 || stagnantCount > 2) health = 'red';
      else if (slaOnTime < 90 || meetingCount === 0 || openCoaching > 0) health = 'yellow';

      return {
        ...user,
        sla_on_time: slaOnTime,
        meeting_count: meetingCount,
        overdue_count: overdueCount,
        extension_count: recentExtensions,
        stagnant_accounts: stagnantCount,
        open_coaching: openCoaching,
        pending_extensions: pendingExtensions,
        latest_flags: latestSummary?.flags || [],
        is_inactive,
        health,
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data sales.', detail: err.message });
  }
});

// GET /api/owner/sales/:id — detail satu sales
router.get('/sales/:id', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const tasks = await prisma.task.findMany({
      where: { user_id: req.params.id },
      include: { extensions: true },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const summaries = await prisma.weeklySummary.findMany({
      where: { user_id: req.params.id },
      orderBy: { week_start: 'desc' },
      take: 8,
    });

    const coachingRequests = await prisma.coachingRequest.findMany({
      where: { user_id: req.params.id },
      orderBy: { created_at: 'desc' },
    });

    res.json({ user, tasks, summaries, coaching_requests: coachingRequests });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail sales.', detail: err.message });
  }
});

module.exports = router;
