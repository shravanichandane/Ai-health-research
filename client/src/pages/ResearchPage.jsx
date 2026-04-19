import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Microscope, Search, Database, FlaskConical, FileText, Send, ArrowLeft, Sparkles, AlertCircle, Zap, Shield, Clock, MessageSquare, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ResearchPage() {
  const [disease, setDisease] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [patientName, setPatientName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/research/conversations`);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const loadConversation = async (id) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/api/research/conversations/${id}`);
      const conv = res.data.conversation;
      if (conv) {
        setConversationId(conv._id);
        setDisease(conv.context?.disease || '');
        setQuery(conv.context?.lastQuery || '');
        // Load the most recent generated response
        const lastAsst = [...conv.messages].reverse().find(m => m.role === 'assistant');
        if (lastAsst) {
          setResult({
            response: lastAsst.content,
            publications: lastAsst.publications || [],
            trials: lastAsst.trials || [],
            metadata: lastAsst.metadata || null
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load past conversation.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    setConversationId(null);
    setDisease('');
    setQuery('');
    setResult(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!disease.trim() && !query.trim()) {
      setError("Please enter a condition or a research query.");
      return;
    }
    
    setError('');
    setLoading(true);
    setResult(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/research`, {
        disease,
        query,
        location,
        patientName,
        conversationId
      });
      
      setResult(response.data);
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
        fetchConversations(); // refresh list
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "An error occurred during research.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
      <nav style={{
        background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: 8
          }}>
            <Microscope size={16} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Cura<span style={{ color: 'var(--accent-light)' }}>Link</span>
          </span>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        
        {/* HISTORY SIDEBAR */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(15, 23, 52, 0.3)' }}>
          <button className="btn-primary" onClick={handleNewSession} style={{ width: '100%', justifyContent: 'center' }}>
             <Plus size={16} /> New Session
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
             <Clock size={14} /> Recent Sessions
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {conversations.length > 0 ? conversations.map((conv) => (
               <div 
                 key={conv.id} 
                 onClick={() => loadConversation(conv.id)}
                 style={{
                   padding: '12px', borderRadius: 8, cursor: 'pointer',
                   background: conversationId === conv.id ? 'var(--accent-glow)' : 'transparent',
                   border: `1px solid ${conversationId === conv.id ? 'var(--accent)' : 'transparent'}`,
                   transition: 'all 0.2s ease', display: 'flex', gap: 10
                 }}
                 onMouseEnter={(e) => { if(conversationId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                 onMouseLeave={(e) => { if(conversationId !== conv.id) e.currentTarget.style.background = 'transparent' }}
               >
                 <MessageSquare size={16} style={{ color: conversationId === conv.id ? 'var(--accent-light)' : 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                 <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: conversationId === conv.id ? 'white' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                       {conv.disease || conv.title || "Untitled Session"}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                       {new Date(conv.updatedAt).toLocaleDateString()}
                    </div>
                 </div>
               </div>
            )) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0' }}>
                No past sessions found.
              </div>
            )}
          </div>
        </div>

        {/* FORM SIDEBAR */}
        <div style={{ width: 350, flexShrink: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={16} color="var(--accent)" />
              Research Parameters
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label>Query Focus (optional)</label>
                <textarea 
                  className="input-field" 
                  placeholder="e.g. Latest treatments or clinical trials..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ minHeight: 60 }}
                />
              </div>
              <div>
                <label>Target Disease / Condition *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Parkinson's Disease"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Location (for trials)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. New York, USA"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Analyzing...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} /> Run Research Pipeline
                  </span>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="glass-card" style={{ padding: 16, borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <AlertCircle size={18} color="var(--danger)" style={{ marginTop: 2 }} />
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Error</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {result?.metadata && (
             <div className="glass-card animate-in" style={{ padding: 20 }}>
               <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: 0.5 }}>Pipeline Stats</h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Processing Time</span>
                   <span style={{ fontWeight: 600 }}>{(result.metadata.processingTimeMs / 1000).toFixed(2)}s</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Total Raw Fetched</span>
                   <span style={{ fontWeight: 600 }}>{result.metadata.totalFetched || '-'}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--text-secondary)' }}>After Dedup</span>
                   <span style={{ fontWeight: 600 }}>{result.metadata.afterDedup || '-'}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Top Ranked Pubs</span>
                   <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{result.metadata.topPublicationsCount || result.publications?.length || 0}</span>
                 </div>
                 
                 <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={12} color="var(--success)" /> 
                      <span style={{ color: 'var(--success)' }}>Grounded in real citations</span>
                    </div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* MAIN AREA - RESULTS */}
        <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', paddingBottom: 60 }}>
          
          {loading ? (
             <div className="glass-card animate-in" style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <div className="spinner" style={{ width: 80, height: 80, borderTopColor: 'var(--accent)', borderRightColor: 'var(--cyan)', animationDuration: '1.2s' }} />
                  <Database size={24} color="var(--accent-light)" style={{ position: 'absolute' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Executing Pipeline</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
                  Expanding query, fetching from PubMed / OpenAlex, re-ranking, and reasoning with AI...
                </p>
             </div>
          ) : result ? (
             <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* AI RESPONSE */}
                <div className="glass-card" style={{ padding: 32 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                     <Sparkles size={20} color="var(--purple)" />
                     <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>AI Synthesized Findings</h2>
                     <div className="badge badge-purple" style={{ marginLeft: 'auto' }}>Mistral-7B</div>
                   </div>
                   
                   <div className="markdown-content" style={{ fontSize: 15, lineHeight: 1.6 }}>
                      <ReactMarkdown>{result.response || "No response generated."}</ReactMarkdown>
                   </div>
                </div>

                {/* TWO COLUMNS: PUBS & TRIALS */}
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                       <FileText size={18} color="var(--cyan)" />
                       Top Cited Source Publications
                     </h3>
                     
                     {result.publications?.length > 0 ? result.publications.map((pub, i) => (
                       <div key={i} className="glass-card" style={{ padding: 20 }}>
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                             <a href={pub.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: 1.4 }}>
                               {pub.title}
                             </a>
                             {pub.year && <div className="badge badge-info">{pub.year}</div>}
                          </div>
                          
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                            {pub.authors && pub.authors.length ? pub.authors.slice(0,3).join(', ') + (pub.authors.length > 3 ? ' et al.' : '') : 'Unknown Authors'}
                          </p>
                          
                          {pub.abstract && (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {typeof pub.abstract === 'string' ? pub.abstract : "No abstract available"}
                            </p>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                               <Database size={12} /> {pub.source || 'Journal'}
                            </span>
                            {pub.url && (
                              <a href={pub.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
                                Read Paper →
                              </a>
                            )}
                          </div>
                       </div>
                     )) : (
                       <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No highly relevant publications found.</p>
                     )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <h3 style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                       <FlaskConical size={18} color="var(--success)" />
                       Relevant Clinical Trials
                     </h3>
                     
                     {result.trials?.length > 0 ? result.trials.map((trial, i) => (
                       <div key={i} className="glass-card" style={{ padding: 20, borderLeft: '3px solid var(--success)' }}>
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                             <a href={trial.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', lineHeight: 1.4 }}>
                               {trial.title}
                             </a>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div className="badge badge-success">{trial.status || 'Unknown'}</div>
                            {trial.phase && <div className="badge badge-warning">{trial.phase}</div>}
                          </div>
                          
                          {trial.conditions && trial.conditions.length > 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                               <Zap size={12} style={{ marginTop: 2, flexShrink: 0 }} color="var(--text-muted)" />
                               <span>{trial.conditions.join(', ')}</span>
                            </div>
                          )}

                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <strong>Eligibility:</strong> {trial.eligibilityGender !== 'All' ? trial.eligibilityGender : ''} Ages {trial.eligibilityAge || 'N/A'}
                            {trial.eligibility && (
                              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {trial.eligibility}
                              </span>
                            )}
                          </div>
                          
                          {trial.locations && trial.locations.length > 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                               📍 {trial.locations[0].facility || 'Multiple locations'} {trial.locations[0].city && `(${trial.locations[0].city})`}
                               {trial.locations.length > 1 && ` + ${trial.locations.length - 1} more`}
                            </div>
                          )}

                          {trial.contacts && trial.contacts.length > 0 && trial.contacts[0].email && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                               📩 Contact: {trial.contacts[0].name ? `${trial.contacts[0].name} - ` : ''} {trial.contacts[0].email}
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                               {trial.id || trial.nctId || 'Clinical Trial'}
                            </span>
                            {trial.url && (
                              <a href={trial.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
                                View Trial →
                              </a>
                            )}
                          </div>
                       </div>
                     )) : (
                       <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No matching clinical trials found.</p>
                     )}
                  </div>
                </div>
             </div>
          ) : (
             <div className="glass-card" style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, borderStyle: 'dashed', background: 'transparent' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Search size={28} color="var(--accent-light)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ready for Research</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
                  Enter a target disease or medical query on the left to start the deep retrieval pipeline.
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
