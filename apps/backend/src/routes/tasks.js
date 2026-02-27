const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { computeTaskStatus } = require('../services/taskStatus');

const router = express.Router();

// GET /api/tasks — semua tasks dengan pagination
router.get('/', authMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  try {
    const where = req.user.role === 'owner' ? {} : { user_id: req.user.id };
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { extensions: true, user: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    // Sinkronkan status secara real-time
    const updated = await Promise.all(
      tasks.map(async (task) => {
        const liveStatus = computeTaskStatus(task);
        if (liveStatus !== task.status) {
          await prisma.task.update({ where: { id: task.id }, data: { status: liveStatus } });
          return { ...task, status: liveStatus };
        }
        return task;
      })
    );

    res.json({ data: updated, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil task.', detail: err.message });
  }
});

// GET /api/tasks/due-today — tasks yang deadline-nya hari ini
router.get('/due-today', authMiddleware, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where: {
        user_id: req.user.id,
        deadline: { gte: today, lt: tomorrow },
      },
      include: { extensions: true },
      orderBy: { deadline: 'asc' },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil task hari ini.', detail: err.message });
  }
});

// POST /api/tasks — buat task baru
router.post('/', authMiddleware, async (req, res) => {
  const { account_name, task_type, title, deadline, difficulty } = req.body;

  if (!account_name || !task_type || !title || !deadline) {
    return res.status(400).json({ error: 'Semua field wajib diisi.' });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate)) {
    return res.status(400).json({ error: 'Format deadline tidak valid.' });
  }

  const validDifficulties = ['low', 'medium', 'high'];
  const taskDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';

  try {
    const task = await prisma.task.create({
      data: {
        user_id: req.user.id,
        account_name,
        task_type,
        title,
        deadline: deadlineDate,
        difficulty: taskDifficulty,
        status: computeTaskStatus({ deadline: deadlineDate, status: 'on_track', extension_count: 0 }),
      },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat task.', detail: err.message });
  }
});

// PATCH /api/tasks/:id/complete — tandai task selesai
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  const { completion_result } = req.body;

  const validResults = ['success', 'lost', 'postponed', 'no_response'];
  if (!completion_result || !validResults.includes(completion_result)) {
    return res.status(400).json({
      error: 'completion_result wajib diisi.',
      valid_values: validResults,
    });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task tidak ditemukan.' });
    if (task.user_id !== req.user.id) return res.status(403).json({ error: 'Bukan task kamu.' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'completed', completed_at: new Date(), completion_result },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyelesaikan task.', detail: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task tidak ditemukan.' });
    if (task.user_id !== req.user.id && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Tidak punya akses.' });
    }

    await prisma.extensionRequest.deleteMany({ where: { task_id: req.params.id } });
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task dihapus.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus task.', detail: err.message });
  }
});

module.exports = router;
