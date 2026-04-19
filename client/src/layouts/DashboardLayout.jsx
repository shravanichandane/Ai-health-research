import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Microscope, LogOut, Search, Activity, Users, FileText } from "lucide-react";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 250, background: 'rgba(15, 23, 52, 0.5)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Microscope size={16} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Cura<span style={{ color: 'var(--accent-light)' }}>Link</span>
          </span>
        </div>

        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
           <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Navigation</div>
           
           <Link to={`/${user.role}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: 'white', background: 'var(--accent-glow)', border: '1px solid var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
             <Activity size={18} /> Dashboard
           </Link>
           
           <Link to="/research" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
             <Search size={18} /> Research Engine
           </Link>

           {user.role === 'doctor' && (
             <Link to="/doctor/patients" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
               <Users size={18} /> My Patients
             </Link>
           )}

           {user.role === 'researcher' && (
             <Link to="/researcher/cohorts" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
               <FileText size={18} /> Cohorts
             </Link>
           )}
        </div>

        <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', fontWeight: 600 }}>
               {user.name.charAt(0)}
             </div>
             <div>
               <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
               <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
             </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
             <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, textTransform: 'capitalize' }}>{user.role} Portal</h1>
          <div className={`badge badge-${user.role === 'patient' ? 'info' : user.role === 'doctor' ? 'success' : 'purple'}`}>
             {user.role} Access
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
           <Outlet />
        </div>
      </main>
    </div>
  );
}
