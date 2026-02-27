'use client';

export function saveAuth(token, user) {
  localStorage.setItem('yescare_token', token);
  localStorage.setItem('yescare_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('yescare_token');
  localStorage.removeItem('yescare_user');
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('yescare_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('yescare_token');
}

export function isAuthenticated() {
  return !!getStoredToken();
}
