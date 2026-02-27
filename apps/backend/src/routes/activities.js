const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/activities/today — cek apakah sudah isi hari ini
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const activity = await prisma.dailyActivity.findFirst({
      where: {
        user_id: req.user.id,
        date: { gte: today, lt: tomorrow },
      },
    });

    res.json(activity || null);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil aktivitas hari ini.', detail: err.message });
  }
});

// GET /api/activities — riwayat aktivitas user
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

// POST /api/activities — input aktivitas harian
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Cek sudah ada hari ini
    const existing = await prisma.dailyActivity.findFirst({
      where: { user_id: req.user.id, date: { gte: today, lt: tomorrow } },
    });

    if (existing) {
      // Update
      const updated = await prisma.dailyActivity.update({
        where: { id: existing.id },
        data: {
          account_progress: Number(account_progress) || 0,
          stakeholder_interaction: Number(stakeholder_interaction) || 0,
          meeting_requested: Number(meeting_requested) || 0,
          follow_up_done: Number(follow_up_done) || 0,
          preventive_shared: Number(preventive_shared) || 0,
          reflection_text: reflection_text.trim(),
        },
      });
      return res.json({ ...updated, updated: true });
    }

    const activity = await prisma.dailyActivity.create({
      data: {
        user_id: req.user.id,
        date: today,
        account_progress: Number(account_progress) || 0,
        stakeholder_interaction: Number(stakeholder_interaction) || 0,
        meeting_requested: Number(meeting_requested) || 0,
        follow_up_done: Number(follow_up_done) || 0,
        preventive_shared: Number(preventive_shared) || 0,
        reflection_text: reflection_text.trim(),
      },
    });

    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan aktivitas.', detail: err.message });
  }
});

module.exports = router;
