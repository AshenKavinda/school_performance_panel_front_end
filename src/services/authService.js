import api from './api';

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async ({ email, password }) => {
  const response = await api.post('/api/auth/login', { email, password });
  const { token, refreshToken, user } = response.data;

  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));

  return { token, refreshToken, user };
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Ignore errors — always clear local state
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// ─── Register Student ────────────────────────────────────────────────────────
// Fields: username, email, password, firstName, lastName, phone?, dateOfBirth
export const registerStudent = async (data) => {
  const response = await api.post('/api/auth/register/student', data);
  return response.data;
};

// ─── Register Application Admin ──────────────────────────────────────────────
// Fields: username, email, password, schoolName?
export const registerApplicationAdmin = async (data) => {
  const response = await api.post('/api/auth/register/application-admin', data);
  return response.data;
};

// ─── Verify Email ────────────────────────────────────────────────────────────
// Fields: email, otp
export const verifyEmail = async ({ email, otp }) => {
  const response = await api.post('/api/auth/verify-email', { email, otp });
  return response.data;
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
// Fields: email
export const forgotPassword = async ({ email }) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};

// ─── Reset Password ──────────────────────────────────────────────────────────
// Fields: email, otp, newPassword
export const resetPassword = async ({ email, otp, newPassword }) => {
  const response = await api.post('/api/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

// ─── Refresh Token (called by interceptor, also exported for manual use) ─────
export const refreshToken = async (token) => {
  const response = await api.post('/api/auth/refresh-token', { refreshToken: token });
  return response.data;
};

// ─── Get Stored User ─────────────────────────────────────────────────────────
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem('token');
