import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, HeartPulse, UploadCloud, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/patient/insights`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadSuccess('');
    try {
      const res = await axios.post(`${API_URL}/api/patient/upload`);
      if (res.data.success) {
        setUploadSuccess(res.data.message);
        fetchData(); // refresh metrics implicitly
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
       <div className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>My Health Overview</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Welcome back. All vital APIs are connected.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             {uploadSuccess && <span style={{ color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} /> {uploadSuccess}</span>}
             <button onClick={handleUpload} disabled={uploading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               {uploading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <UploadCloud size={16} />} 
               Upload Document
             </button>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
             <Activity size={24} color="var(--cyan)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Health Score</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>
                {data ? `${data.healthScore}/100` : '-'}
             </div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
             <ShieldAlert size={24} color="var(--success)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Recent Findings</h3>
             <div style={{ fontSize: 32, fontWeight: 700 }}>
                {data ? `${data.criticalFlags} Critical` : '-'}
             </div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
             <HeartPulse size={24} color="var(--purple)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Active Trackers</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple)' }}>
                {data ? `${data.activeTrackers} Markers` : '-'}
             </div>
          </div>
       </div>
    </div>
  );
}
