from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature 
from study_guide_llm.configs import (
    SECRET_KEY, 
    MAX_AGE, 
    SESSION_MAX_AGE,
    MAIL_SALT, 
    RESEND_API_KEY,
    MAIL_FROM,
    BACKEND_URI
)
import resend

signer = URLSafeTimedSerializer(SECRET_KEY)
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

AUTH_TOKEN_SALT = "study_guide_auth_session_token"

def generate_auth_token(user_data: dict) -> str:
    """Generate a signed time-limited bearer token containing user identity."""
    return signer.dumps(user_data, salt=AUTH_TOKEN_SALT)

def verify_auth_token(token: str, max_age: int | None = None) -> dict | None:
    """Verify signed bearer token and return user data if valid and unexpired."""
    if max_age is None:
        max_age = SESSION_MAX_AGE
    try:
        data = signer.loads(token, max_age=int(max_age), salt=AUTH_TOKEN_SALT)
        return data if isinstance(data, dict) else None
    except Exception:
        return None

def generate_email_verification_token(email: str):
    """Generate a time-limited token for email verification."""
    return signer.dumps(email, salt=MAIL_SALT)

def send_email_verification(email: str):
    try:
        token = generate_email_verification_token(email)
        
        subject = "Email Verification"
        verification_url = f"{BACKEND_URI}/auth/verify-email?token={token}"
        
        html_content = f"""
        <h3>Welcome! Please verify your email</h3>
        <p>Click the link below to activate your account:</p>
        <a href="{verification_url}">Verify Email</a>
        <p>This link will expire in 2 hours.</p>
        """

        params: resend.Emails.SendParams = {
            "from": MAIL_FROM,
            "to": email,
            "subject": subject,
            "html": html_content
        }

        email_result = resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def verification_token(token: str):
    """Verify email verification token. Return email address if valid."""
    try:
        email = signer.loads(token, max_age=int(MAX_AGE), salt=MAIL_SALT)
        return email
    except SignatureExpired:
        return None
    except BadTimeSignature:
        return None