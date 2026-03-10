import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, loginUser, logout, logoutUser, registerUser } from '../features/auth/authSlice';
import { forgotPassword, resetPassword } from '../api';

function AuthCenter() {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state) => state.auth);
  const [mode, setMode] = useState('login'); // login | register | forgot | reset
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [resetForm, setResetForm] = useState({ token: '', newPassword: '' });
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !user) dispatch(fetchMe());
  }, [dispatch, user]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setInfo('');
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedName = form.name.trim();
    const normalizedPassword = form.password;

    if (mode === 'login') {
      dispatch(loginUser({ email: normalizedEmail, password: normalizedPassword }));
      return;
    }

    dispatch(registerUser({ name: normalizedName, email: normalizedEmail, password: normalizedPassword }));
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      setInfo('');
      const email = form.email.trim().toLowerCase();
      const response = await forgotPassword({ email });
      const devToken = response?.data?.resetToken;
      setInfo(devToken ? `Reset token (dev): ${devToken}` : 'If this email exists, reset instructions generated.');
      setMode('reset');
      if (devToken) {
        setResetForm((prev) => ({ ...prev, token: devToken }));
      }
    } catch (err) {
      setInfo(err.response?.data?.message || 'Failed to generate reset token');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      setInfo('');
      await resetPassword({
        token: resetForm.token.trim(),
        newPassword: resetForm.newPassword,
      });
      setInfo('Password reset successful. You can login now.');
      setMode('login');
      setResetForm({ token: '', newPassword: '' });
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setInfo(err.response?.data?.message || 'Password reset failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(logout());
  };

  if (user) {
    return (
      <div className="dashboard-card">
        <h3>Account</h3>
        <p>Logged in as <strong>{user.name}</strong> ({user.email})</p>
        <button className="btn-primary mt-4" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h3>
        {mode === 'login' && 'Login'}
        {mode === 'register' && 'Register'}
        {mode === 'forgot' && 'Forgot Password'}
        {mode === 'reset' && 'Reset Password'}
      </h3>

      {(mode === 'login' || mode === 'register') && (
        <form onSubmit={handleAuthSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          {error && <p style={{ color: '#fc466b', marginBottom: 12 }}>{error}</p>}
          {info && <p style={{ color: '#2563eb', marginBottom: 12, wordBreak: 'break-all' }}>{info}</p>}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need Register?' : 'Have Account?'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode('forgot')}>
              Forgot Password
            </button>
          </div>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={handleForgot}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          {info && <p style={{ color: '#2563eb', marginBottom: 12, wordBreak: 'break-all' }}>{info}</p>}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Processing...' : 'Generate Reset Token'}</button>
            <button type="button" className="btn-secondary" onClick={() => setMode('login')}>Back to Login</button>
          </div>
        </form>
      )}

      {mode === 'reset' && (
        <form onSubmit={handleReset}>
          <div className="form-group">
            <label>Reset Token</label>
            <input
              value={resetForm.token}
              onChange={(e) => setResetForm((prev) => ({ ...prev, token: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={resetForm.newPassword}
              onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              minLength={6}
              required
            />
          </div>
          {info && <p style={{ color: '#2563eb', marginBottom: 12, wordBreak: 'break-all' }}>{info}</p>}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Resetting...' : 'Reset Password'}</button>
            <button type="button" className="btn-secondary" onClick={() => setMode('login')}>Back to Login</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AuthCenter;
