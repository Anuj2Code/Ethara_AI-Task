import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErr(''); };

  async function handleSubmit() {
    setLoading(true);
    setErr('');
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name || !form.email || !form.password) {
          setErr('All fields required');
          return;
        }
        await signup(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: 390, background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40,
      }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Project & Task Management
          </p>
        </div>

        <div className="tab-bar" style={{ margin: '0 auto 24px', display: 'flex' }}>
          <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Sign In
          </button>
          <button className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>
            Sign Up
          </button>
        </div>

        {tab === 'signup' && (
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Jane Doe" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {err && (
          <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 12 }}>{err}</p>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
        >
          {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {tab === 'login' && (
          <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 20, lineHeight: 1.8 }}>
            The first account you create becomes Admin.<br />
            Subsequent accounts are Members.
          </p>
        )}
      </div>
    </div>
  );
}
