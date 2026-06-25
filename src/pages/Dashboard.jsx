import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ROLES = [
  { id: 'Java Developer', icon: '☕' },
  { id: 'React Developer', icon: '⚛️' },
  { id: 'Full Stack Developer', icon: '🔧' },
  { id: 'Data Analyst', icon: '📊' },
  { id: 'ML Engineer', icon: '🤖' },
];

const DIFFICULTIES = [
  { id: 'Easy', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  { id: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  { id: 'Hard', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
];

export default function Dashboard() {
  const [role, setRole] = useState('Java Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const name = localStorage.getItem('name') || 'there';

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/interview/start', { role, difficulty });
      navigate('/interview', { state: res.data });
    } catch {
      alert('Failed to start interview. Make sure backend and Ollama are running.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const selectedDiff = DIFFICULTIES.find(d => d.id === difficulty);

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#fff'
    }}>
      {/* Navbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid #1a1a2e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '9px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px'
          }}>🧠</div>
          <span style={{ fontWeight: '600', fontSize: '15px' }}>MockMate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '600'
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid #1e1e30',
            borderRadius: '8px', padding: '6px 14px',
            color: '#9090a8', fontSize: '13px', cursor: 'pointer'
          }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 6px' }}>
            Hey, {name} 👋
          </h1>
          <p style={{ color: '#6b6b80', fontSize: '15px', margin: 0 }}>
            Ready for your next mock interview?
          </p>
        </div>

        {/* Start Interview Card */}
        <div style={{
          background: '#12121e', border: '1px solid #1e1e2e',
          borderRadius: '20px', padding: '1.75rem'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>
            Start new interview
          </h2>
          <p style={{ color: '#6b6b80', fontSize: '13px', margin: '0 0 1.75rem' }}>
            Pick a role and difficulty to begin
          </p>

          {/* Role selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#9090a8', fontSize: '12px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Role
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
                  background: role === r.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#0d0d1a',
                  border: role === r.id ? '1px solid #6366f1' : '1px solid #1e1e30',
                  color: role === r.id ? '#fff' : '#9090a8'
                }}>
                  <span>{r.icon}</span> {r.id}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selector */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#9090a8', fontSize: '12px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Difficulty
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {DIFFICULTIES.map(d => (
                <button key={d.id} onClick={() => setDifficulty(d.id)} style={{
                  padding: '8px 20px', borderRadius: '10px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                  background: difficulty === d.id ? d.bg : '#0d0d1a',
                  border: difficulty === d.id ? `1px solid ${d.border}` : '1px solid #1e1e30',
                  color: difficulty === d.id ? d.color : '#9090a8'
                }}>
                  {d.id}
                </button>
              ))}
            </div>
          </div>

          {/* Summary + CTA */}
          <div style={{
            background: '#0d0d1a', border: '1px solid #1e1e30',
            borderRadius: '12px', padding: '1rem 1.25rem',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1.25rem'
          }}>
            <div>
              <p style={{ color: '#6b6b80', fontSize: '12px', margin: '0 0 2px' }}>Selected</p>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                {role} · <span style={{ color: selectedDiff?.color }}>{difficulty}</span>
              </p>
            </div>
            <span style={{ fontSize: '20px' }}>
              {ROLES.find(r => r.id === role)?.icon}
            </span>
          </div>

          <button
            onClick={startInterview}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#3730a3' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '12px', padding: '14px',
              color: '#fff', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Starting...' : `Start ${role} Interview →`}
          </button>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: '1.5rem', padding: '1rem 1.25rem',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <p style={{ color: '#9090a8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            You can answer by typing or using the <strong style={{ color: '#818cf8' }}>🎤 mic button</strong> in the interview.
            Use Chrome or Brave for best speech recognition support.
          </p>
        </div>
      </div>
    </div>
  );
}