const express = require('express');
const cors = require('cors');
const { startCronJobs } = require('./jobs/weeklyJob');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const extensionRoutes = require('./routes/extensions');
const activityRoutes = require('./routes/activities');
const weeklyRoutes = require('./routes/weekly');
const coachingRoutes = require('./routes/coaching');
const ownerRoutes = require('./routes/owner');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'YESCARE API berjalan normal', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/weekly', weeklyRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/owner', ownerRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 YESCARE API berjalan di http://localhost:${PORT}`);
  startCronJobs();
});
