import { Link } from 'react-router-dom';
import { Microscope, Search, Brain, FileText, FlaskConical, ArrowRight, Sparkles, Database, Zap, Shield, Users, BookOpen } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Microscope size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            Cura<span style={{ color: 'var(--accent-light)' }}>Link</span>
          </span>
        </div>
        <Link to="/research" className="btn-primary" style={{ fontSize: 13 }}>
          Launch App <ArrowRight size={14} />
        </Link>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="badge badge-purple" style={{ marginBottom: 20, fontSize: 12, padding: '6px 16px' }}>
          <Sparkles size={12} /> Powered by Open-Source AI
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800,
          lineHeight: 1.1, maxWidth: 800, marginBottom: 20,
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-light) 50%, var(--cyan) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          AI Medical Research Assistant
        </h1>

        <p style={{
          fontSize: 18, lineHeight: 1.6, color: 'var(--text-secondary)',
          maxWidth: 600, marginBottom: 36,
        }}>
          Find relevant publications, clinical trials, and research insights — all powered by a custom open-source LLM with real-time data from PubMed, OpenAlex, and ClinicalTrials.gov.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/research" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15 }}>
            <Search size={18} /> Start Researching
          </Link>
          <a href="#features" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
            How It Works
          </a>
        </div>

        {/* Data Source Logos */}
        <div style={{
          display: 'flex', gap: 32, marginTop: 56, alignItems: 'center',
          color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
        }}>
          <span style={{ opacity: 0.5 }}>DATA SOURCES:</span>
          {['PubMed', 'OpenAlex', 'ClinicalTrials.gov'].map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
            }}>
              <Database size={12} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{
          fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 12,
        }}>
          Not Just a Chatbot — A <span style={{ color: 'var(--accent-light)' }}>Research Engine</span>
        </h2>
        <p style={{
          textAlign: 'center', color: 'var(--text-secondary)', maxWidth: 600,
          margin: '0 auto 48px', fontSize: 15,
        }}>
          Deep retrieval, intelligent re-ranking, and structured reasoning — backed by real medical sources.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {[
            { icon: Search, title: 'Deep Retrieval', desc: 'Fetches 50-300 results from PubMed, OpenAlex, and ClinicalTrials.gov — then filters and ranks to show only the most relevant.', color: 'var(--accent)' },
            { icon: Brain, title: 'Custom LLM Reasoning', desc: 'Uses Mistral-7B (open-source) to synthesize findings into structured, citation-backed responses. No Gemini or OpenAI.', color: 'var(--purple)' },
            { icon: FileText, title: 'Source Attribution', desc: 'Every claim is backed by clickable citations with title, authors, year, journal, and direct links to the original paper.', color: 'var(--cyan)' },
            { icon: FlaskConical, title: 'Clinical Trials', desc: 'Automatically surfaces relevant ongoing trials with status, eligibility criteria, locations, and contact information.', color: 'var(--success)' },
            { icon: Zap, title: 'Context-Aware Follow-ups', desc: 'Ask "Can I take Vitamin D?" after researching lung cancer — the system remembers your context and personalizes the answer.', color: 'var(--warning)' },
            { icon: Shield, title: 'No Hallucinations', desc: 'Responses are grounded in retrieved publications. The LLM cites only what it found in the research — zero fabrication.', color: 'var(--danger)' },
          ].map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${f.color}15`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section style={{ padding: '60px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>
          The <span style={{ color: 'var(--cyan)' }}>Pipeline</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '1', title: 'Query Expansion', desc: 'LLM expands "deep brain stimulation" → "deep brain stimulation Parkinson\'s disease treatment outcomes"', icon: Sparkles },
            { step: '2', title: 'Parallel Fetch (3 APIs)', desc: 'OpenAlex (100+) + PubMed (100+) + ClinicalTrials.gov (50+) = 250+ raw results', icon: Database },
            { step: '3', title: 'Dedup & Merge', desc: 'Cross-source deduplication into unified schema — ~200 unique items', icon: Users },
            { step: '4', title: 'Intelligent Re-Ranking', desc: 'Score by relevance × recency × citation count × source credibility → Top 6-8', icon: Zap },
            { step: '5', title: 'LLM Reasoning', desc: 'Mistral-7B synthesizes top results into structured, cited response', icon: Brain },
            { step: '6', title: 'Structured Output', desc: 'Overview + Research Insights + Clinical Trials + Full Source Attribution', icon: BookOpen },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {s.step}
                </div>
                {i < 5 && (
                  <div style={{ width: 2, height: 40, background: 'var(--border)', margin: '4px 0' }} />
                )}
              </div>
              <div style={{ paddingBottom: i < 5 ? 20 : 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '60px 24px', textAlign: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Ready to Research?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          No sign-up required. Start querying real medical data instantly.
        </p>
        <Link to="/research" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
          <Microscope size={18} /> Open CuraLink
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '24px', textAlign: 'center',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)', fontSize: 12,
      }}>
        CuraLink AI — Open-source medical research assistant. Built with MERN + Mistral-7B.
      </footer>
    </div>
  );
}
