const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware, ownerOnly } = require('../middleware/auth');
const { generateWeeklySummary } = require('../services/weeklyEngine');

const router = express.Router();

// GET /api/weekly — summary terbaru user
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

// POST /api/weekly/generate — trigger manual
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const summary = await generateWeeklySummary(req.user.id);
    res.json({ message: 'Weekly summary berhasil dibuat.', summary });
  } catch (err) {
    res.status(500).json({ error: 'Gagal generate summary.', detail: err.message });
  }
});

// PATCH /api/weekly/:id/self-assessment — sales isi nilai diri sendiri (1-5)
router.patch('/:id/self-assessment', authMiddleware, async (req, res) => {
  const scoreNum = parseInt(req.body.score);

  if (!scoreNum || scoreNum < 1 || scoreNum > 5) {
    return res.status(400).json({ error: 'Score harus antara 1 sampai 5.' });
  }

  try {
    const summary = await prisma.weeklySummary.findUnique({ where: { id: req.params.id } });
    if (!summary) return res.status(404).json({ error: 'Summary tidak ditemukan.' });
    if (summary.user_id !== req.user.id) return res.status(403).json({ error: 'Bukan summary kamu.' });

    const updated = await prisma.weeklySummary.update({
      where: { id: req.params.id },
      data: { self_assessment: scoreNum },
    });
    res.json({ message: 'Self assessment tersimpan.', summary: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan self assessment.', detail: err.message });
  }
});

// PATCH /api/weekly/:id/owner-note — owner tambah catatan untuk sales
router.patch('/:id/owner-note', authMiddleware, ownerOnly, async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim() === '') {
    return res.status(400).json({ error: 'Catatan tidak boleh kosong.' });
  }

  try {
    const summary = await prisma.weeklySummary.findUnique({ where: { id: req.params.id } });
    if (!summary) return res.status(404).json({ error: 'Summary tidak ditemukan.' });

    const updated = await prisma.weeklySummary.update({
      where: { id: req.params.id },
      data: { owner_note: note.trim() },
    });
    res.json({ message: 'Catatan owner tersimpan.', summary: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan catatan.', detail: err.message });
  }
});

module.exports = router;
