import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('name', res.data.name);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ color: '#9090a8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#0d0d1a', border: '1px solid #1e1e30',
          borderRadius: '10px', padding: '11px 14px',
          color: '#fff', fontSize: '14px', outline: 'none'
        }}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', margin: '0 auto 1rem'
          }}>🧠</div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 4px' }}>MockMate</h1>
          <p style={{ color: '#6b6b80', fontSize: '14px', margin: 0 }}>AI-powered interview practice</p>
        </div>

        <div style={{
          background: '#12121e', border: '1px solid #1e1e2e',
          borderRadius: '20px', padding: '2rem'
        }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 6px' }}>
            Create account
          </h2>
          <p style={{ color: '#6b6b80', fontSize: '13px', margin: '0 0 1.75rem' }}>
            Start practicing for your dream role today
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', padding: '10px 14px', borderRadius: '10px',
              fontSize: '13px', marginBottom: '1.25rem'
            }}>{error}</div>
          )}

          {field('Full name', 'name', 'text', 'Rahul')}
          {field('Email', 'email', 'email', 'you@example.com')}
          {field('Password', 'password', 'password', '••••••••')}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: '0.5rem',
              background: loading ? '#3730a3' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '10px', padding: '12px',
              color: '#fff', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Get started →'}
          </button>
        </div>

        <p style={{ color: '#6b6b80', fontSize: '13px', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: '500' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}