const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { generateWeeklySummary } = require('../services/weeklyEngine');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/weekly — ambil summary terbaru user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const summary = await prisma.weeklySummary.findFirst({
      where: { user_id: req.user.id },
      orderBy: { week_start: 'desc' },
    });
    res.json(summary || null);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil weekly summary.', detail: err.message });
  }
});

// GET /api/weekly/all — semua riwayat weekly user
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const summaries = await prisma.weeklySummary.findMany({
      where: { user_id: req.user.id },
      orderBy: { week_start: 'desc' },
      take: 10,
    });
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil riwayat.', detail: err.message });
  }
});

// POST /api/weekly/generate — trigger manual (juga dipanggil cron)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const summary = await generateWeeklySummary(req.user.id);
    res.json({ message: 'Weekly summary berhasil dibuat.', summary });
  } catch (err) {
    res.status(500).json({ error: 'Gagal generate summary.', detail: err.message });
  }
});

module.exports = router;
