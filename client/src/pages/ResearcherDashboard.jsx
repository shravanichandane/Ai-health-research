import { useState } from 'react';
import { Database, Filter, Target, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ResearcherDashboard() {
  const [data, setData] = useState({ totalRecords: 14204, matches: 0, confidence: 'N/A' });
  const [loading, setLoading] = useState(false);

  const runCohortSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/researcher/cohorts`);
      setData(res.data);
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
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Research Cohorts</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Query builder and trial matching system.</p>
          </div>
          <button className="btn-primary" onClick={runCohortSearch} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Search size={16} />}
            Run Aggregation
          </button>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
             <Database size={24} color="var(--cyan)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>De-identified Records</h3>
             <div style={{ fontSize: 32, fontWeight: 700 }}>{data.totalRecords.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
             <Target size={24} color="var(--success)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Found Matches</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--success)' }}>{data.matches}</div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
             <Filter size={24} color="var(--purple)" style={{ marginBottom: 12 }} />
             <h3 style={{ fontSize: 14, color: 'var(--text-muted)' }}>Model Confidence</h3>
             <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple)' }}>{data.confidence}</div>
          </div>
       </div>
    </div>
  );
}
