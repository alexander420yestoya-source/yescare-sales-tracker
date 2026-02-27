/**
 * Format tanggal ke bahasa Indonesia
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Hitung sisa waktu deadline
 */
export function timeRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end - now;

  if (diffMs < 0) {
    const absDiff = Math.abs(diffMs);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    if (hours < 24) return `Terlambat ${hours} jam`;
    const days = Math.floor(hours / 24);
    return `Terlambat ${days} hari`;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes} menit lagi`;
  }
  if (hours < 24) return `${hours} jam lagi`;
  const days = Math.floor(hours / 24);
  return `${days} hari lagi`;
}

/**
 * Label status task dalam bahasa Indonesia
 */
export function statusLabel(status) {
  const map = {
    on_track: 'On Track',
    near_deadline: 'Hampir Deadline',
    overdue: 'Terlambat',
    extended: 'Diperpanjang',
    completed: 'Selesai',
  };
  return map[status] || status;
}

export function statusClass(status) {
  const map = {
    on_track: 'badge-green',
    near_deadline: 'badge-yellow',
    overdue: 'badge-red',
    extended: 'badge-blue',
    completed: 'badge-gray',
  };
  return map[status] || 'badge-gray';
}

/**
 * Label task type dalam bahasa Indonesia
 */
export function taskTypeLabel(type) {
  const map = {
    proposal: 'Proposal',
    follow_up: 'Follow-up',
    meeting_request: 'Request Meeting',
    document_submission: 'Pengiriman Dokumen',
    preventive_check: 'Preventive Check',
    other: 'Lainnya',
  };
  return map[type] || type;
}

/**
 * Health color untuk owner dashboard
 */
export function healthColor(health) {
  if (health === 'green') return 'text-green-600 bg-green-50';
  if (health === 'yellow') return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export function healthLabel(health) {
  if (health === 'green') return 'Sehat';
  if (health === 'yellow') return 'Perhatian';
  return 'Intervensi';
}
