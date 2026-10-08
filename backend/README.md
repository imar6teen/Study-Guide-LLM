# Study Guide LLM — Backend

FastAPI backend for the **Study Guide LLM** (Academic Engine) project. It powers email-verified authentication and a LangGraph **multi-agent** system that researches topics and generates structured study guides with credible references.

## Tech Stack

- **[FastAPI](https://fastapi.tiangolo.com/)** + **Uvicorn** — web framework & ASGI server
- **[LangChain](https://www.langchain.com/)** + **[LangGraph](https://langchain-ai.github.io/langgraph/)** — multi-agent orchestration (Router → Planner → Teacher → Response)
- **LangGraph Checkpoint Postgres** — agent state / conversation thread persistence
- **BYOK LLM providers** — OpenAI, Google Gemini, Anthropic, Groq via `langchain-openai` / `-google-genai` / `-anthropic` / `-groq`. The user supplies the provider, model and API key.
- **[Firecrawl](https://firecrawl.dev/)** — web search & web scraping tools for gathering references
- **[SQLModel](https://sqlmodel.tiwari.app/)** + **SQLAlchemy** — ORM
- **PostgreSQL** (`psycopg2-binary`, `psycopg[binary]`) — database
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
├── requirements.txt                # Exported for App Engine (uv export)
├── app.yaml                        # App Engine Standard config
├── env.example.yaml                # Template for env.yaml (deploy env vars, git-ignored)
├── migrations/
│   ├── env.py                      # Alembic env (reads DB_URI from env)
│   └── versions/
│       └── bd006a88ea8a_create_tables.py   # Initial schema
└── src/study_guide_llm/
    ├── __init__.py                 # Package entry point (study-guide-llm CLI)
    ├── configs/                    # Environment variable loading (.env)
    ├── llm/                        # BYOK provider registry, model factory, header dependency
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
    │   ├── auth.py                 # Auth routes
    │   └── llm.py                  # BYOK provider list & key validation
    └── utils.py                    # Email verification token helpers
```

## Prerequisites

- **Python 3.10+**
- **[uv](https://docs.astral.sh/uv/)** (package manager)
- **PostgreSQL** database (e.g. hosted on Supabase) reachable via `DB_URI`
- An API key for one of the supported LLM providers (entered by the user in the frontend)
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
| `COOKIE_SAMESITE` | Session cookie SameSite: `lax` (default) or `none` (frontend on another domain) | No |
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

All chat calls that hit the LLM require the BYOK headers (see below).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Send a message to the agent. Creates a chat room on new threads, returns AI reply, thread id, topic, subtopics & references |
| `GET` | `/chat` | List the current user's chat rooms (ordered by last update) |
| `GET` | `/load/{thread_id}` | Load full chat history for a room |

### LLM / BYOK (`/llm`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/llm/providers` | Supported providers with default & suggested models and where to get a key |
| `POST` | `/llm/validate` | Validate the provider/key/model in the headers with a tiny test call |
| `GET` | `/healthz` | Health check |

## Bring Your Own Key (BYOK)

The backend has **no LLM credentials**. On first visit the frontend asks the user for a provider, model and API key, validates them with `POST /llm/validate`, stores them **in the browser (localStorage)** and sends them on every LLM request:

| Header | Value |
|--------|-------|
| `X-LLM-Provider` | `openai` \| `google` \| `anthropic` \| `groq` |
| `X-LLM-API-Key` | The user's API key |
| `X-LLM-Model` | Optional; defaults to the provider's `default_model` |

The key is never stored server-side: a chat model is built per request and passed to LangGraph through the runtime `context` (not the `RunnableConfig`), so it is not written to Postgres checkpoints or LangSmith trace metadata.

Error responses use `detail.code` so the frontend can react (e.g. re-open the key dialog):

| Status | `detail.code` | Meaning |
|--------|---------------|---------|
| 400 | `llm_credentials_missing` / `llm_provider_unsupported` / `llm_model_not_found` | Bad or missing BYOK input |
| 401 | `llm_invalid_key` | Provider rejected the key |
| 429 | `llm_rate_limited` | Provider quota / rate limit |
| 502 | `llm_provider_error` | Other provider failure |

Providers, default models and the structured-output method per provider are defined in [`src/study_guide_llm/llm/__init__.py`](./src/study_guide_llm/llm/__init__.py).

## Deploying to Google App Engine (Standard)

```bash
cd backend

# 1. Deploy-time env vars (git-ignored, included by app.yaml)
cp env.example.yaml env.yaml   # then fill it in

# 2. Re-export requirements whenever dependencies change
uv export --no-emit-project --no-hashes --no-dev --no-header -o requirements.txt

# 3. Deploy
gcloud app deploy
```

Notes:
- `APP_ENV` must not be `dev` in production → session cookie becomes `Secure` and CORS is pinned to `FRONTEND_URI`.
- If the frontend is on a different domain than `*.appspot.com`, set `COOKIE_SAMESITE: "none"`.
- Run `alembic upgrade head` against the production database before the first deploy.

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
- **Agent errors in the console** — check the `detail.code` of the response; verify the API key, the model name and the provider quota.
