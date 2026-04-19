-- ============================================================
-- CuraLink AI — Complete Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'researcher')),
    avatar_url TEXT,
    specialization TEXT,
    institution TEXT,
    license_number TEXT,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. MEDICAL DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('lab_report', 'prescription', 'radiology', 'discharge_summary', 'insurance', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes INTEGER,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    raw_ocr_text TEXT,
    structured_data JSONB,
    ai_summary TEXT,
    ai_insights JSONB,
    processing_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients see own documents" ON medical_documents FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients upload own documents" ON medical_documents FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE INDEX idx_documents_patient ON medical_documents(patient_id);
CREATE INDEX idx_documents_status ON medical_documents(status);
CREATE INDEX idx_documents_created ON medical_documents(created_at DESC);

-- ============================================================
-- 3. BIOMARKERS (Extracted from documents)
-- ============================================================
CREATE TABLE IF NOT EXISTS biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES medical_documents(id),
    name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    reference_min REAL,
    reference_max REAL,
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'high', 'low', 'critical')),
    category TEXT,
    recorded_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE biomarkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients see own biomarkers" ON biomarkers FOR SELECT USING (auth.uid() = patient_id);

CREATE INDEX idx_biomarkers_patient ON biomarkers(patient_id);
CREATE INDEX idx_biomarkers_name ON biomarkers(name);
CREATE INDEX idx_biomarkers_date ON biomarkers(recorded_date);

-- ============================================================
-- 4. HEALTH INSIGHTS (AI-generated)
-- ============================================================
CREATE TABLE IF NOT EXISTS health_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES medical_documents(id),
    insight_type TEXT NOT NULL CHECK (insight_type IN ('critical', 'warning', 'recommendation', 'info')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    action_items JSONB DEFAULT '[]',
    citations JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT FALSE,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients see own insights" ON health_insights FOR SELECT USING (auth.uid() = patient_id);

CREATE INDEX idx_insights_patient ON health_insights(patient_id);
CREATE INDEX idx_insights_type ON health_insights(insight_type);

-- ============================================================
-- 5. CHAT SESSIONS & MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    context_type TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users see own messages" ON chat_messages FOR SELECT USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
);

-- ============================================================
-- 6. DOCTOR-PATIENT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    patient_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(doctor_id, patient_id)
);

ALTER TABLE doctor_patient_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors see own assignments" ON doctor_patient_assignments FOR SELECT USING (auth.uid() = doctor_id);

-- ============================================================
-- 7. SOAP NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES profiles(id),
    patient_id UUID NOT NULL REFERENCES profiles(id),
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    ai_confidence REAL DEFAULT 0,
    validated_by_doctor BOOLEAN DEFAULT FALSE,
    reasoning_tree JSONB,
    source_documents JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors see own SOAP" ON soap_notes FOR SELECT USING (auth.uid() = doctor_id);

-- ============================================================
-- 8. CLINICAL TRIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinical_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE, -- e.g., NCT number
    title TEXT NOT NULL,
    description TEXT,
    phase TEXT,
    status TEXT DEFAULT 'recruiting',
    conditions JSONB DEFAULT '[]',
    eligibility_criteria JSONB,
    locations JSONB DEFAULT '[]',
    sponsor TEXT,
    start_date DATE,
    end_date DATE,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. TRIAL MATCHES (Patient → Trial)
-- ============================================================
CREATE TABLE IF NOT EXISTS trial_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID NOT NULL REFERENCES clinical_trials(id),
    patient_id UUID NOT NULL REFERENCES profiles(id),
    researcher_id UUID REFERENCES profiles(id),
    match_score REAL DEFAULT 0,
    matching_criteria JSONB DEFAULT '[]',
    status TEXT DEFAULT 'matched' CHECK (status IN ('matched', 'pending', 'interested', 'enrolled', 'declined')),
    invited_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trial_id, patient_id)
);

ALTER TABLE trial_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients see own matches" ON trial_matches FOR SELECT USING (auth.uid() = patient_id);

-- ============================================================
-- 10. MEDICAL KNOWLEDGE EMBEDDINGS (for pgvector RAG)
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('pubmed', 'guideline', 'patient_document', 'clinical_trial')),
    source_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384), -- MiniLM-L6 dimension
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX idx_embeddings_vector ON medical_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_embeddings_source ON medical_embeddings(source_type);

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_documents_updated BEFORE UPDATE ON medical_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessions_updated BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_soap_updated BEFORE UPDATE ON soap_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_medical_knowledge(
    query_embedding vector(384),
    match_count INTEGER DEFAULT 5,
    source_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source_type TEXT,
    title TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        me.id,
        me.source_type,
        me.title,
        me.content,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM medical_embeddings me
    WHERE (source_filter IS NULL OR me.source_type = source_filter)
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- ============================================================
-- SUPABASE STORAGE BUCKETS (apply via Dashboard or API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
