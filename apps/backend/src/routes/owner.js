const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/owner/sales — daftar semua sales dengan ringkasan
router.get('/sales', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const salesUsers = await prisma.user.findMany({
      where: { role: 'sales' },
      select: { id: true, name: true, email: true },
    });

    const result = await Promise.all(salesUsers.map(async (user) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Tasks 30 hari terakhir
      const tasks = await prisma.task.findMany({
        where: { user_id: user.id, created_at: { gte: thirtyDaysAgo } },
      });

      const totalTasks = tasks.length;
      const completedOnTime = tasks.filter(
        (t) =>
          t.status === 'completed' &&
          t.completed_at &&
          new Date(t.completed_at) <= new Date(t.deadline)
      ).length;
      const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
      const slaOnTime = totalTasks > 0 ? Math.round((completedOnTime / totalTasks) * 100) : 100;

      // Extension 7 hari
      const recentExtensions = tasks.reduce((sum, t) => sum + t.extension_count, 0);

      // Activities 7 hari
      const activities = await prisma.dailyActivity.findMany({
        where: { user_id: user.id, date: { gte: sevenDaysAgo } },
      });
      const meetingCount = activities.reduce((sum, a) => sum + a.meeting_requested, 0);

      // Akun stagnan
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const allTasks = await prisma.task.findMany({ where: { user_id: user.id } });
      const recentAccounts = new Set(
        allTasks
          .filter((t) => new Date(t.created_at) >= fourteenDaysAgo)
          .map((t) => t.account_name)
      );
      const stagnantCount = [...new Set(allTasks.map((t) => t.account_name))].filter(
        (acc) => !recentAccounts.has(acc)
      ).length;

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

      // Health score
      let health = 'green';
      if (slaOnTime < 80 || overdueCount > 2 || stagnantCount > 2) health = 'red';
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
