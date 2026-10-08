from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

def _load_simple_yaml(path: Path) -> dict:
    vars_dict = {}
    in_env = False
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("#"):
                    continue
                if stripped.startswith("env_variables:"):
                    in_env = True
                    continue
                if in_env and ":" in stripped:
                    k, v = stripped.split(":", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    vars_dict[k] = v
    except Exception as err:
        print(f"Warning: could not parse {path} with fallback: {err}")
    return vars_dict

# If env.yaml is present (e.g. deployed to GCP App Engine or local env.yaml), load its env_variables
for candidate in [
    Path.cwd() / "env.yaml",
    Path(__file__).resolve().parents[3] / "env.yaml",
    Path(__file__).resolve().parents[2] / "env.yaml",
]:
    if candidate.exists():
        data = None
        try:
            import yaml
            with open(candidate, "r", encoding="utf-8") as f:
                loaded = yaml.safe_load(f)
                if loaded and isinstance(loaded, dict) and "env_variables" in loaded:
                    data = loaded["env_variables"]
        except Exception:
            pass

        if data is None:
            data = _load_simple_yaml(candidate)

        if data:
            for k, v in data.items():
                if k not in os.environ or os.getenv("GAE_APPLICATION") or os.getenv("GAE_ENV") or k in ("APP_ENV", "COOKIE_SAMESITE", "SESSION_MAX_AGE", "FRONTEND_URI", "BACKEND_URI"):
                    os.environ[k] = str(v)
            break

APP_ENV = os.getenv("APP_ENV", "dev")

DEFAULT_IMAGE = os.getenv("DEFAULT_IMAGE", "default.png")

DB_URI = os.getenv("DB_URI")

SECRET_KEY = os.getenv("SECRET_KEY", "0da150249ccfe0203013b4685fe6b11c0fdc471e46b55257191b27baec3ddee2")

# Session max age in seconds (default: 7 days = 604800s)
SESSION_MAX_AGE = int(os.getenv("SESSION_MAX_AGE", "604800"))

# Email token expiry in seconds (default: 300s = 5 mins)
MAX_AGE = os.getenv("MAX_AGE", "300")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_SALT = os.getenv("MAIL_SALT", "study_guide_mail_salt")

FRONTEND_URI = os.getenv("FRONTEND_URI", "http://localhost:5173")
BACKEND_URI = os.getenv("BACKEND_URI", "http://localhost:8000")

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")

# Session cookie SameSite policy:
# Use "none" for cross-site environments (e.g. Cloud Run frontend + App Engine backend).
# In production, default to "none"; in dev default to "lax".
COOKIE_SAMESITE = os.getenv(
    "COOKIE_SAMESITE",
    "none" if APP_ENV != "dev" else "lax"
).lower()

# NOTE: LLM provider / model / API key are no longer configured here.
# They are supplied per request by the user (BYOK) — see study_guide_llm.llm