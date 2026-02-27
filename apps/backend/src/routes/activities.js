const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getTodayDate() {
  // Normalize to UTC midnight for consistent UNIQUE(user_id, date) behavior
  const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  return new Date(todayStr); // 2026-xx-xxT00:00:00.000Z
}

// GET /api/activities/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = getTodayDate();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const activity = await prisma.dailyActivity.findFirst({
      where: { user_id: req.user.id, date: { gte: today, lt: tomorrow } },
    });

    res.json(activity || null);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil aktivitas hari ini.', detail: err.message });
  }
});

// GET /api/activities
router.get('/', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const activities = await prisma.dailyActivity.findMany({
      where: { user_id: req.user.id },
      orderBy: { date: 'desc' },
      take: limit,
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil riwayat aktivitas.', detail: err.message });
  }
});

// POST /api/activities — upsert aktivitas harian
router.post('/', authMiddleware, async (req, res) => {
  const {
    account_progress,
    stakeholder_interaction,
    meeting_requested,
    follow_up_done,
    preventive_shared,
    reflection_text,
  } = req.body;

  if (!reflection_text || reflection_text.trim() === '') {
    return res.status(400).json({ error: 'Refleksi harian wajib diisi.' });
  }

  try {
    const today = getTodayDate();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const existing = await prisma.dailyActivity.findFirst({
      where: { user_id: req.user.id, date: { gte: today, lt: tomorrow } },
    });

    const data = {
      account_progress: Number(account_progress) || 0,
      stakeholder_interaction: Number(stakeholder_interaction) || 0,
      meeting_requested: Number(meeting_requested) || 0,
      follow_up_done: Number(follow_up_done) || 0,
      preventive_shared: Number(preventive_shared) || 0,
      reflection_text: reflection_text.trim(),
    };

    if (existing) {
      const updated = await prisma.dailyActivity.update({ where: { id: existing.id }, data });
      return res.json({ ...updated, updated: true });
    }

    const activity = await prisma.dailyActivity.create({
      data: { user_id: req.user.id, date: today, ...data },
    });

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan aktivitas.', detail: err.message });
  }
});

module.exports = router;
