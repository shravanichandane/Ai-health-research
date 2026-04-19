import { useState, useEffect } from 'react';
import { Users, FileStack, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/doctor/patients`);
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
       <div className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Doctor Console</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Practice overview and patient risk monitoring.</p>
          </div>
          <button className="btn-primary">Add Patient</button>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
             <Users size={24} color="var(--success)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Registered Patients</h3>
             <div style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '-' : patients.length}</div>
          </div>
          <div className="glass-card" style={{ padding: 24, borderLeft: '4px solid var(--danger)' }}>
             <TrendingUp size={24} color="var(--danger)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Critical Flags</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>0 Patients</div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
             <FileStack size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Pending SOAP Notes</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>0</div>
          </div>
       </div>

       <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Patient Roster</h3>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {patients.length > 0 ? patients.map((p, i) => (
             <div key={i} className="glass-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                </div>
                <div className="badge badge-info">Stable</div>
             </div>
          )) : (
             <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                {loading ? 'Loading patients...' : 'No patients found.'}
             </div>
          )}
       </div>
    </div>
  );
}
