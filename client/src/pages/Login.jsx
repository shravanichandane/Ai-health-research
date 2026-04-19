import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Microscope, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`); // route to specific dashboard
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
       <div className="glass-card animate-in" style={{ width: '100%', maxWidth: 400, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 30 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Microscope size={22} color="white" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              Cura<span style={{ color: 'var(--accent-light)' }}>Link</span>
            </span>
          </Link>
          
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Welcome Back</h2>
          
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, marginBottom: 16, width: '100%', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>Email Address</label>
              <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: 8, justifyContent: 'center', padding: '14px' }}>
               Sign In <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>Create Account</Link>
          </p>
       </div>
    </div>
  );
}
