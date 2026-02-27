const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { authMiddleware, getSecret } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      getSecret(),
      { expiresIn: '7d' }
    );

    const response = {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };

    if (user.must_change_password) {
      response.force_password_change = true;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Gagal login.', detail: err.message });
  }
});

// PATCH /api/auth/change-password — ganti password (wajib setelah akun baru dibuat owner)
router.patch('/change-password', authMiddleware, async (req, res) => {
  const { new_password } = req.body;

  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
  }

  try {
    const hash = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password_hash: hash, must_change_password: false },
    });
    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah password.', detail: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, must_change_password: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user.', detail: err.message });
  }
});

module.exports = router;
