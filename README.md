# 🧬 CuraLink AI — Connecting Cures, Empowering Lives

> AI-Powered Medical Research Assistant bridging Patients, Doctors, and Researchers.

![Architecture](https://img.shields.io/badge/Architecture-3_Tier_Microservices-blue)
![AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-green)
![Status](https://img.shields.io/badge/Status-MVP_Ready-brightgreen)

## 🌟 What Makes CuraLink Different?

| Feature | Description | Impact |
|---------|-------------|--------|
| 🔥 **Medical Heatmap Overlay** | AI highlights critical values on the original uploaded document | Doctors spot issues in seconds |
| 📊 **Smart Health Comparison** | Visual diff of two reports showing changes, like "git diff for health" | Track progress over time |
| 📄 **3-Tier Report Translation** | Every insight in Technical, Simplified, and Plain Language | Accessible to all literacy levels |
| 🚨 **Emergency Flag System** | Real-time detection of critically abnormal values with pulsing alerts | Potentially life-saving |
| 🛡️ **Interactive Risk Radar** | Spider chart across cardiovascular, metabolic, thyroid, and more | Holistic health view |
| 🧠 **AI Reasoning Tree** | Visual tree showing exactly HOW the AI arrived at each conclusion | Full transparency for doctors |
| 📎 **Citation-Grounded Chat** | Every AI claim backed by clickable citations with confidence scores | Zero hallucination tolerance |
| 📈 **Recruitment Funnel** | Visual funnel for clinical trial enrollment tracking | Accelerates research |

## 🏗️ Architecture

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   Next.js 14     │────▶│   Express API     │────▶│  FastAPI + AI    │
│   (Frontend)     │     │   (Gateway)       │     │  (Multi-Agent)   │
│   Port 3000      │     │   Port 3001       │     │  Port 8000       │
└──────────────────┘     └───────────────────┘     └──────────────────┘
                               │                          │
                               ▼                          ▼
                    ┌───────────────────┐      ┌──────────────────┐
                    │   Supabase        │      │  Google Gemini   │
                    │   (PostgreSQL +   │      │  1.5 Flash       │
                    │    pgvector)      │      │  (+ Groq backup) │
                    └───────────────────┘      └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase account (free tier)
- Google Gemini API key

### 1. Clone & Install

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# AI Service
cd ai-service && pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase + Gemini keys
```

### 3. Setup Database

Run `database/schema.sql` in your Supabase SQL Editor.

### 4. Start Development Servers

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: AI Service
cd ai-service && python main.py
```

### 5. Open
Navigate to `http://localhost:3000`

## 📁 Project Structure

```
curalink/
├── frontend/               # Next.js 14 App Router
│   ├── src/app/
│   │   ├── (auth)/         # Login, Register
│   │   ├── (dashboard)/    # Role-based dashboards
│   │   │   ├── patient/    # Patient pages (7 routes)
│   │   │   ├── doctor/     # Doctor pages (4 routes)
│   │   │   └── researcher/ # Researcher pages (4 routes)
│   │   └── page.tsx        # Landing page
│   └── src/lib/            # Utils, types, stores, mock data
├── backend/                # Express API Gateway
│   └── src/
│       ├── routes/         # Auth, Patient, Doctor, Researcher, Chat, AI
│       ├── middleware/     # Auth, Logger, Error handling
│       └── config/         # Supabase, Environment
├── ai-service/             # FastAPI AI Pipeline
│   ├── routers/            # Analyze, Chat, Summarize, Trials, Literature
│   ├── agents/             # Vision, NLP, Reasoning agents
│   └── vectorstore/        # pgvector RAG
├── database/               # Supabase SQL schema
│   └── schema.sql          # 10 tables + pgvector + RLS
└── docker-compose.yml      # Full stack orchestration
```

## 🎯 Demo Accounts

| Role | Button | Dashboard |
|------|--------|-----------|
| Patient | Click "Patient" on login | Health score, risk radar, insights, trials |
| Doctor | Click "Doctor" on login | SOAP notes, reasoning tree, biomarker trends |
| Researcher | Click "Researcher" on login | Cohort builder, recruitment funnel |

## 🔐 Security

- Row Level Security (RLS) on all tables
- JWT authentication via Supabase Auth
- HIPAA-ready architecture
- De-identified data for researchers
- AES-256 encryption at rest

## 📜 License

MIT © 2025 CuraLink AI
