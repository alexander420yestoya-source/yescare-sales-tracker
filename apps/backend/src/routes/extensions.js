const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/extensions — request extension untuk task
router.post('/', authMiddleware, async (req, res) => {
  const { task_id, reason, reason_detail, requested_deadline } = req.body;

  if (!task_id || !reason || !requested_deadline) {
    return res.status(400).json({ error: 'task_id, reason, dan requested_deadline wajib diisi.' });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: task_id } });
    if (!task) return res.status(404).json({ error: 'Task tidak ditemukan.' });
    if (task.user_id !== req.user.id) return res.status(403).json({ error: 'Bukan task kamu.' });

    // Validasi: max 2 extension
    if (task.extension_count >= 2) {
      return res.status(400).json({ error: 'Maksimal 2 extension per task sudah tercapai.' });
    }

    // Validasi: tidak boleh sudah overdue
    if (task.status === 'overdue') {
      return res.status(400).json({ error: 'Tidak bisa request extension setelah task overdue.' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Task sudah selesai.' });
    }

    // Cek tidak ada pending extension
    const pendingExt = await prisma.extensionRequest.findFirst({
      where: { task_id, status: 'pending' },
    });
    if (pendingExt) {
      return res.status(400).json({ error: 'Masih ada extension yang menunggu persetujuan.' });
    }

    const ext = await prisma.extensionRequest.create({
      data: {
        task_id,
        reason,
        reason_detail: reason_detail || null,
        requested_deadline: new Date(requested_deadline),
      },
    });

    res.status(201).json(ext);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat extension request.', detail: err.message });
  }
});

// GET /api/extensions/pending — owner lihat semua pending
router.get('/pending', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const extensions = await prisma.extensionRequest.findMany({
      where: { status: 'pending' },
      include: {
        task: { include: { user: { select: { name: true } } } },
      },
      orderBy: { requested_at: 'asc' },
    });
    res.json(extensions);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data.', detail: err.message });
  }
});

// PATCH /api/extensions/:id/approve — owner approve
router.patch('/:id/approve', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const ext = await prisma.extensionRequest.findUnique({ where: { id: req.params.id } });
    if (!ext) return res.status(404).json({ error: 'Extension tidak ditemukan.' });
    if (ext.status !== 'pending') return res.status(400).json({ error: 'Extension sudah diproses.' });

    // Update extension
    const updated = await prisma.extensionRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date(),
      },
    });

    // Update task deadline & status
    await prisma.task.update({
      where: { id: ext.task_id },
      data: {
        deadline: ext.requested_deadline,
        status: 'extended',
        extension_count: { increment: 1 },
      },
    });

    res.json({ message: 'Extension disetujui.', extension: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal approve extension.', detail: err.message });
  }
});

// PATCH /api/extensions/:id/reject — owner reject
router.patch('/:id/reject', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const ext = await prisma.extensionRequest.findUnique({ where: { id: req.params.id } });
    if (!ext) return res.status(404).json({ error: 'Extension tidak ditemukan.' });
    if (ext.status !== 'pending') return res.status(400).json({ error: 'Extension sudah diproses.' });

    const updated = await prisma.extensionRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        approved_by: req.user.id,
        approved_at: new Date(),
      },
    });

    res.json({ message: 'Extension ditolak.', extension: updated });
  } catch (err) {
    res.status(500).json({ error: 'Gagal reject extension.', detail: err.message });
  }
});

module.exports = router;
