from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature 
from study_guide_llm.configs import (
    SECRET_KEY, 
    MAX_AGE, 
    MAIL_SALT, 
    RESEND_API_KEY,
    MAIL_FROM,
    BACKEND_URI
)
import resend
import string
import random
from datetime import datetime, timedelta

signer = URLSafeTimedSerializer(SECRET_KEY)
resend.api_key = RESEND_API_KEY

def generate_email_verification_token(email : str):
    """Generate a time-limited token for email verification."""
    return signer.dumps(email, salt=MAIL_SALT)

def send_email_verification(email : str):
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

        params : resend.Emails.SendParams = {
            "from" : MAIL_FROM,
            "to" : email,
            "subject" : subject,
            "html" : html_content
        }

        email = resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def verification_token(token : str):
    """Verify token. Return email address if valid"""
    try:
        email = signer.loads(token, max_age = int(MAX_AGE), salt=MAIL_SALT)
        return email
    except SignatureExpired:
        return None
    except BadTimeSignature:
        return None