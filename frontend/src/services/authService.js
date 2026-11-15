import api from './api.js';

export async function loginRequest(credentials, { demo = false, previewRole = 'DEVELOPER' } = {}) {
  if (demo) {
    return {
      user: {
        username: credentials.username || 'priya',
        role: previewRole,
        organization: 'Northwind Labs',
      },
      accessToken: null,
      demo: true,
    };
  }
  const { data } = await api.post('/auth/login', credentials);
  return {
    user: data.user || data,
    accessToken: data.accessToken || data.token || null,
    demo: false,
  };
}

export async function logoutRequest() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Local session cleanup still proceeds if the backend has no logout endpoint yet.
  }
}
