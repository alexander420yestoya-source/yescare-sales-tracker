const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('yescare_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan.');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  changePassword: (new_password) =>
    request('/api/auth/change-password', { method: 'PATCH', body: JSON.stringify({ new_password }) }),
  me: () => request('/api/auth/me'),

  // Tasks
  getTasks: (page = 1, limit = 20) => request(`/api/tasks?page=${page}&limit=${limit}`),
  getDueTodayTasks: () => request('/api/tasks/due-today'),
  createTask: (data) => request('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  completeTask: (id, completion_result) =>
    request(`/api/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ completion_result }) }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Extensions
  requestExtension: (data) =>
    request('/api/extensions', { method: 'POST', body: JSON.stringify(data) }),
  getPendingExtensions: () => request('/api/extensions/pending'),
  approveExtension: (id) => request(`/api/extensions/${id}/approve`, { method: 'PATCH' }),
  rejectExtension: (id) => request(`/api/extensions/${id}/reject`, { method: 'PATCH' }),

  // Activities
  getTodayActivity: () => request('/api/activities/today'),
  getActivities: () => request('/api/activities'),
  submitActivity: (data) =>
    request('/api/activities', { method: 'POST', body: JSON.stringify(data) }),

  // Weekly
  getWeeklySummary: () => request('/api/weekly'),
  getAllWeeklySummaries: () => request('/api/weekly/all'),
  generateWeeklySummary: () => request('/api/weekly/generate', { method: 'POST' }),
  selfAssessment: (id, score) =>
    request(`/api/weekly/${id}/self-assessment`, { method: 'PATCH', body: JSON.stringify({ score }) }),
  ownerNote: (id, note) =>
    request(`/api/weekly/${id}/owner-note`, { method: 'PATCH', body: JSON.stringify({ note }) }),

  // Coaching
  getCoachingRequests: () => request('/api/coaching'),
  getCoachingReasons: () => request('/api/coaching/reasons'),
  submitCoaching: (reason) =>
    request('/api/coaching', { method: 'POST', body: JSON.stringify({ reason }) }),
  closeCoaching: (id) => request(`/api/coaching/${id}/close`, { method: 'PATCH' }),

  // Owner
  getSalesTeam: () => request('/api/owner/sales'),
  getSalesDetail: (id) => request(`/api/owner/sales/${id}`),
  createUser: (data) => request('/api/owner/users', { method: 'POST', body: JSON.stringify(data) }),
  editUser: (id, data) => request(`/api/owner/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  resetUserPassword: (id) => request(`/api/owner/users/${id}/reset-password`, { method: 'PATCH' }),
  deleteUser: (id) => request(`/api/owner/users/${id}`, { method: 'DELETE' }),
};
