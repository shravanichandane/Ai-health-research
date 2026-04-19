import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Microscope, ArrowRight, UserPlus, Stethoscope, FileSearch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await register(email, password, name, role);
      navigate(`/${user.role}`); 
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
       <div className="glass-card animate-in" style={{ width: '100%', maxWidth: 440, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
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
          
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Create your account</h2>
          
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, marginBottom: 16, width: '100%', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label>Select Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                 {[{id: 'patient', icon: UserPlus, label: 'Patient'}, {id: 'doctor', icon: Stethoscope, label: 'Doctor'}, {id: 'researcher', icon: FileSearch, label: 'Researcher'}].map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => setRole(r.id)}
                      style={{ 
                         padding: '12px 8px', borderRadius: 8, border: `1px solid ${role === r.id ? 'var(--accent)' : 'var(--border)'}`, 
                         background: role === r.id ? 'var(--accent-glow)' : 'transparent',
                         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                       <r.icon size={18} color={role === r.id ? 'var(--accent-light)' : 'var(--text-muted)'} />
                       <span style={{ fontSize: 11, fontWeight: 600, color: role === r.id ? 'white' : 'var(--text-secondary)' }}>{r.label}</span>
                    </div>
                 ))}
              </div>
            </div>
            
            <div>
              <label>Full Name</label>
              <input type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: 8, justifyContent: 'center', padding: '14px' }}>
               Create Account <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </p>
       </div>
    </div>
  );
}
