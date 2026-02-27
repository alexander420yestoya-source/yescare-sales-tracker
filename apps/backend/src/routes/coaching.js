const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();

const COACHING_REASONS = [
  'Objection handling',
  'Budget issue',
  'Stakeholder access',
  'Proposal structuring',
  'SLA issue',
];

// GET /api/coaching — coaching requests milik user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = req.user.role === 'owner' ? {} : { user_id: req.user.id };
    const requests = await prisma.coachingRequest.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil coaching requests.', detail: err.message });
  }
});

// GET /api/coaching/reasons — daftar alasan
router.get('/reasons', (req, res) => {
  res.json(COACHING_REASONS);
});

// POST /api/coaching — submit coaching request
router.post('/', authMiddleware, async (req, res) => {
  const { reason } = req.body;

  if (!reason || !COACHING_REASONS.includes(reason)) {
    return res.status(400).json({
      error: 'Alasan tidak valid.',
      valid_reasons: COACHING_REASONS,
    });
  }

  try {
    const coaching = await prisma.coachingRequest.create({
      data: { user_id: req.user.id, reason },
    });
    res.status(201).json({ message: 'Coaching request terkirim! 💪', coaching });
  } catch (err) {
    res.status(500).json({ error: 'Gagal submit coaching request.', detail: err.message });
  }
});

// PATCH /api/coaching/:id/close — owner tutup coaching request
router.patch('/:id/close', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const coaching = await prisma.coachingRequest.findUnique({ where: { id: req.params.id } });
    if (!coaching) return res.status(404).json({ error: 'Coaching request tidak ditemukan.' });

    const updated = await prisma.coachingRequest.update({
      where: { id: req.params.id },
      data: { status: 'closed' },
    });
    res.json({ message: 'Coaching request ditutup.', coaching: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menutup coaching request.', detail: err.message });
  }
});

module.exports = router;
