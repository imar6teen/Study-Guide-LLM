# Study Guide LLM — Backend

FastAPI backend for the **Study Guide LLM** (Academic Engine) project. It powers email-verified authentication and a LangGraph **multi-agent** system that researches topics and generates structured study guides with credible references.

## Tech Stack

- **[FastAPI](https://fastapi.tiangolo.com/)** + **Uvicorn** — web framework & ASGI server
- **[LangChain](https://www.langchain.com/)** + **[LangGraph](https://langchain-ai.github.io/langgraph/)** — multi-agent orchestration (Router → Planner → Teacher → Response)
- **LangGraph Checkpoint Postgres** — agent state / conversation thread persistence
- **LangChain Ollama** — local LLM interface (`ChatOllama`, default model `gemma4:latest`)
- **[Firecrawl](https://firecrawl.dev/)** — web search & web scraping tools for gathering references
- **[SQLModel](https://sqlmodel.tiwari.app/)** + **SQLAlchemy** — ORM
- **PostgreSQL** (`psycopg2`) — database
- **[Alembic](https://alembic.sqlalchemy.org/)** — database migrations
- **bcrypt** — password hashing
- **[Resend](https://resend.com/)** — transactional email (verification emails)
- **itsdangerous** — signed, time-limited email verification tokens
- **LangSmith** — LLM tracing / observability
- **uv** — Python package & environment management

## Project Structure

```
backend/
├── alembic.ini                     # Alembic configuration
├── pyproject.toml                  # Project metadata & dependencies (uv)
├── migrations/
│   ├── env.py                      # Alembic env (reads DB_URI from env)
│   └── versions/
│       └── bd006a88ea8a_create_tables.py   # Initial schema
└── src/study_guide_llm/
    ├── __init__.py                 # Package entry point (study-guide-llm CLI)
    ├── configs/                    # Environment variable loading (.env)
    ├── app/
    │   ├── main.py                 # FastAPI app + chat routes
    │   ├── db.py                   # Database session & queries
    │   └── types/                  # Pydantic request/response models
    ├── agents/
    │   ├── __init__.py             # LangGraph state graph + agents
    │   ├── instructions.py         # Prompt instructions per agent
    │   ├── memory.py               # (stub) agent memory
    │   └── tools.py                # Firecrawl-based web_search & web_scraper
    ├── models/                     # SQLModel tables
    ├── routers/
    │   └── auth.py                 # Auth routes
    └── utils.py                    # Email verification token helpers
```

## Prerequisites

- **Python 3.10+**
- **[uv](https://docs.astral.sh/uv/)** (package manager)
- **PostgreSQL** database (e.g. hosted on Supabase) reachable via `DB_URI`
- **Ollama** running locally with the configured model pulled (e.g. `gemma4:latest`)
- **Firecrawl** API key, **Resend** API key (optional — needed for email verification)

## Setup & Run

```bash
cd backend

# Install dependencies
uv sync

# Copy the environment template and fill in your values
cp .env.example .env

# Apply database migrations
alembic upgrade head

# Run the development server (port 8000)
uvicorn study_guide_llm.app.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `/docs`.

## Environment Variables

All config is loaded from a `.env` file (see [`.env.example`](./.env.example)). Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_ENV` | Environment name (e.g. `dev`). Controls DB connection logging | No |
| `DB_URI` | PostgreSQL connection string (Supabase / any Postgres) | **Yes** |
| `SECRET_KEY` | Secret used for session signing & verification tokens | **Yes** |
| `MAX_AGE` | Session max age / token expiry (seconds) | **Yes** |
| `RESEND_API_KEY` | Resend API key for sending verification email | **Yes** |
| `MAIL_FROM` | Sender address for verification emails | **Yes** |
| `MAIL_SALT` | Salt used to sign email verification tokens | **Yes** |
| `FRONTEND_URI` | Frontend base URL (used for redirects) | Yes |
| `BACKEND_URI` | Backend's own base URL (used in verification links) | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl API key (web search / scrape) | **Yes** |
| `MODEL_NAME` | Ollama model name, e.g. `gemma4:latest` | **Yes** |
| `DEFAULT_IMAGE` | Default profile image filename for new users | No |
| `LANGSMITH_API_KEY` | LangSmith API key (tracing) | No |
| `LANGSMITH_TRACING` | Enable/disable LangSmith tracing (`true`/`false`) | No |
| `LANGSMITH_ENDPOINT` | LangSmith region endpoint | No |
| `LANGSMITH_PROJECT` | LangSmith project name | No |

> **Security:** never commit your real `.env`. It is git-ignored by default.

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Create an account; sends email-verification link |
| `POST` | `/auth/login` | Log in (username + password), session-based |
| `GET` | `/auth/me` | Return the current logged-in user (401 if none) |
| `GET` | `/auth/verify-email?token=...` | Verify email via signed token; redirects to frontend |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Send a message to the agent. Creates a chat room on new threads, returns AI reply, thread id, topic, subtopics & references |
| `GET` | `/chat` | List the current user's chat rooms (ordered by last update) |
| `GET` | `/load/{thread_id}` | Load full chat history for a room |

## The Multi-Agent System (LangGraph)

The chat endpoint runs a state machine with four agents plus a tool node:

```
START → Router → Planner → Teacher → Response → END
                 │            │
                 └── tool_node ┘  (web_search / web_scraper)
```

- **Router** — analyzes user intent and routes to `planner` (new study guide), `teacher` (deep-dive on an existing topic), or `response` (off-topic → polite refusal).
- **Planner** — researches a topic using `web_search`/`web_scraper`, produces 3–6 ordered subtopics plus a references map (subtopic → URLs). Iterates up to 5 tool-call rounds.
- **Teacher** — generates in-depth, academically rigorous Markdown for each subtopic, with 2–4 credible references each. Also handles direct deep-dive questions.
- **Response** — synthesizes the final study guide (or refusal), appending references at the end of each subtopic.

**Threading & memory:** agent state and conversation history are persisted via `PostgresSaver` keyed by the chat `thread_id`, so follow-up messages continue the same study guide.

## Database Migrations

The schema is managed with Alembic. To create a new migration after changing models:

```bash
alembic revision --autogenerate -m "describe change"
```

Apply pending migrations:

```bash
alembic upgrade head
```

## Scripts

Utility scripts live in `src/study_guide_llm/scripts/` (web search, web scrape, standalone agent demos, image generation helper).

## Common Issues

- **Email not sending** — check `RESEND_API_KEY` and `MAIL_FROM`.
- **"Connecting to the database..." hangs / fails** — verify `DB_URI` and network access to your Postgres host.
- **Agent errors in the console** — verify Ollama is running and the `MODEL_NAME` model is pulled.
