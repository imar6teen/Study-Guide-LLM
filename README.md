# Study Guide LLM

An AI-powered **Study Guide / Academic Engine** that researches any topic and generates structured, academically rigorous study guides with credible references. It combines a **FastAPI + LangGraph multi-agent backend** with a **React + TypeScript frontend** and email-verified authentication.

## Architecture

```
Study Guide LLM/
├── backend/        FastAPI + LangChain/LangGraph multi-agent system (Router → Planner → Teacher → Response)
└── frontend/       React 19 + TypeScript + Vite chat interface (Material Design 3 dark theme)
```

The flow: the user submits a topic → the backend's agents research the web, break the topic into subtopics, and generate a detailed Markdown study guide — each subtopic backed by credible references. Conversations are persisted per thread so follow-up messages continue the same guide.

### Multi-Agent System

```
START → Router → Planner → Teacher → Response → END
                 │            │
                 └── tool_node ┘  (web_search / web_scraper)
```

- **Router** — classifies user intent and routes to the right agent.
- **Planner** — researches and plans 3–6 subtopics with a references map.
- **Teacher** — writes in-depth, academically rigorous content per subtopic.
- **Response** — synthesizes the final guide and appends references.

## Tech Stack (high-level)

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand |
| Backend | FastAPI, LangChain, LangGraph, SQLModel, PostgreSQL, Alembic |
| LLM | Ollama (local), LangSmith (tracing) |
| Extras | Firecrawl (web search/scrape), Resend (email verification) |

## Prerequisites

- **Node.js 24.18.0** (frontend)
- **Python 3.10+** and **[uv](https://docs.astral.sh/uv/)** (backend)
- **PostgreSQL** — database (e.g. Supabase)
- **Ollama** running locally with the configured model pulled
- **Firecrawl** and **Resend** API keys

## Quick Start

```bash
# Backend (port 8000)
cd backend
uv sync
cp .env.example .env        # fill in DB_URI, SECRET_KEY, API keys, etc.
alembic upgrade head
uvicorn study_guide_llm.app.main:app --reload

# Frontend (port 5173) — in a separate terminal
cd frontend
npm install
cp .env.example .env        # set VITE_BACKEND_URL
npm run dev
```

Open `http://localhost:5173` in your browser.

## Showcasing Skills

This project demonstrates a wide range of engineering and AI/LLM skills:

- **Multi-agent orchestration** — designing and wiring a stateful LangGraph graph (Router → Planner → Teacher → Response) with tool calling, iteration limits, and thread-persisted memory.
- **LLM integration & prompting** — crafting agent-specific prompt instructions, working with a local Ollama model, and chaining research → planning → generation.
- **Web research tooling** — building Firecrawl-based `web_search` and `web_scraper` tools and feeding real, citable sources into generated guides.
- **Full-stack async web application** — a FastAPI backend with session-based auth, chat, and thread persistence, paired with a modern React frontend.
- **Authentication & security** — email-verified signup with signed, time-limited tokens (itsdangerous), bcrypt password hashing, and cookie-based sessions.
- **Database modeling & migrations** — SQLModel ORM with Alembic versioned migrations on PostgreSQL.
- **Frontend engineering** — React Router, form validation with react-hook-form + zod, Zustand state management, and a Material Design 3 dark theme in Tailwind CSS v4.
- **Observability** — LangSmith tracing for LLM execution.

## Folder Documentation

For setup, configuration, and API details, see the README in each folder:

- [**Backend README**](./backend/README.md) — tech stack, project structure, environment variables, API endpoints, migration workflow, and troubleshooting.
- [**Frontend README**](./frontend/README.md) — tech stack, project structure, environment variables, routes, features, and API integration.
