# Study Guide LLM — Frontend

React frontend for the **Study Guide LLM** (Academic Engine) project. Provides an email-verified authentication flow and an interactive chat interface for generating AI study guides powered by the backend's multi-agent system.

## Tech Stack

- **[React 19](https://react.dev/)** + **TypeScript** + **[Vite](https://vite.dev/)**
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Material Design 3 dark theme (Playfair Display + Inter)
- **[react-router](https://reactrouter.com/)** — routing
- **[react-hook-form](https://react-hook-form.com/)** + **[zod](https://zod.dev/)** — form validation
- **[zustand](https://zustand-demo.pmnd.rs/)** — state management (auth store)
- **[react-markdown](https://github.com/remarkjs/react-markdown)** — renders AI Markdown responses (code blocks, tables, blockquotes)
- **[ESLint](https://eslint.org/)** + typescript-eslint — linting

## Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                    # App entry point
    ├── App.tsx                     # Router setup
    ├── index.css                   # Tailwind v4 theme (Material dark)
    ├── components/                 # CreateAccountForm, SignInForm, InputForm, Icon
    ├── pages/                      # Chat, Signin, Signup
    ├── constants/                  # Route definitions
    ├── helpers/                    # API calls (chat, me, signin, signup)
    ├── hooks/                      # useAuthStore, useGetMe
    ├── types/                      # auth & chat TypeScript types, zod schemas
    ├── errors/                     # ServerError, UnauthorizedError
    ├── utils/                      # string helpers
    └── assets/                     # static assets
```

## Prerequisites

- **Node.js 24.18.0** (see `engines` in `package.json`)
- The **backend** running and reachable (see `VITE_BACKEND_URL` below)

## Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Copy the environment template and configure the backend URL
cp .env.example .env

# Start the dev server (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Environment Variables

Vite exposes env vars prefixed with `VITE_` at build time. Configuration lives in a `.env` file (see [`.env.example`](./.env.example)):

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Base URL of the backend API | `http://localhost:8000` |

> **Security:** never commit your real `.env`. It is git-ignored by default.

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | — | Redirects to `/app/chat` |
| `/app/signup` | Signup | Create an account (email verification required) |
| `/app/signin` | Signin | Log in with username + password |
| `/app/chat` | Chat | Main chat / study guide interface |

## Features

- **Email-verified signup & signin** — session-based auth via cookies (`credentials: "include"`).
- **AI study guide chat** — interactive chat backed by the backend multi-agent system; AI responses rendered in Markdown.
- **Chat history sidebar** — list and resume previous chat rooms with relative timestamps.
- **Copy guide** — copy the raw Markdown study guide.
- **Suggested prompts** — one-click example prompts on the landing screen (e.g. "Literature Review: Recent advances in CRISPR-Cas9").
- **Form validation** — zod + react-hook-form.
- **Responsive Material Design 3 dark theme** with custom design tokens.

## API Integration

All backend calls go through small helper modules in `src/helpers/`:

- `signup.ts`, `signin.ts` — authentication
- `me.ts` — fetch the current user (`GET /auth/me`)
- `chat.ts` — list rooms (`GET /chat`), load history (`GET /load/:threadId`), send messages (`POST /`)

Errors are normalized into `UnauthorizedError` (401) and `ServerError` (500) types defined in `src/errors/`.
