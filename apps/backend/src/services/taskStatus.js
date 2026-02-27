/**
 * Hitung status task berdasarkan deadline dan waktu sekarang.
 * Dipanggil setiap kali task dibaca, agar selalu akurat.
 */
function computeTaskStatus(task) {
  if (task.status === 'completed') return 'completed';

  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffMs = deadline - now;
  const fourHoursMs = 4 * 60 * 60 * 1000;

  if (task.extension_count > 0 && diffMs > 0) return 'extended';
  if (diffMs < 0) return 'overdue';
  if (diffMs <= fourHoursMs) return 'near_deadline';
  return 'on_track';
}

module.exports = { computeTaskStatus };
