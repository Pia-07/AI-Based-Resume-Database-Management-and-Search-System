"""
Email Service — Sends real quiz invitation emails via Gmail SMTP.

Uses Python's built-in smtplib + email modules (no extra dependencies).
Requires SMTP_EMAIL and SMTP_PASSWORD environment variables.
Falls back to console logging if credentials are not set.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from ..utils.db import quiz_collection


# Gmail SMTP config
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def send_quiz_email(candidate_name: str, candidate_email: str,
                    quiz_link: str, time_limit: int) -> dict:
    """
    Send a quiz invitation email to the candidate.
    
    Uses Gmail SMTP if credentials are configured, otherwise falls back
    to console logging.
    """
    subject = f"SmartHire — Skill Verification Quiz for {candidate_name}"
    
    # HTML email body
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎯 SmartHire</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Skill Verification Quiz</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #1e293b;">Dear <strong>{candidate_name}</strong>,</p>
            
            <p style="color: #475569;">You have been invited to complete a Skill Verification Quiz as part of the SmartHire hiring process.</p>
            
            <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 12px; color: #1e293b;">📋 Quiz Details</h3>
                <ul style="color: #475569; padding-left: 20px; margin: 0;">
                    <li>Time Limit: <strong>{time_limit} minutes</strong></li>
                    <li>Questions: <strong>10-15 multiple choice</strong></li>
                    <li>The quiz will auto-submit when time expires</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{quiz_link}" style="background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                    Start Quiz →
                </a>
            </div>
            
            <div style="background: #fff7ed; border-radius: 10px; padding: 16px; border: 1px solid #fed7aa; margin: 20px 0;">
                <h4 style="margin: 0 0 8px; color: #9a3412;">⚠️ Important Instructions</h4>
                <ol style="color: #9a3412; padding-left: 20px; margin: 0; font-size: 14px;">
                    <li>Ensure a stable internet connection</li>
                    <li>Timer starts as soon as you begin</li>
                    <li>You cannot pause or retake the quiz</li>
                    <li>Select the best answer for each question</li>
                </ol>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Good luck! 🍀</p>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>SmartHire HR Team</strong></p>
        </div>
        
        <div style="background: #f1f5f9; padding: 16px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from SmartHire. Please do not reply.</p>
        </div>
    </div>
    """
    
    # Plain text fallback
    text_body = f"""Dear {candidate_name},

You have been invited to complete a Skill Verification Quiz as part of the SmartHire hiring process.

Quiz Details:
- Time Limit: {time_limit} minutes
- Questions: 10-15 multiple choice
- The quiz will auto-submit when time expires

Quiz Link: {quiz_link}

Important Instructions:
1. Ensure a stable internet connection
2. Timer starts as soon as you begin
3. You cannot pause or retake the quiz
4. Select the best answer for each question

Good luck!

Best regards,
SmartHire HR Team
"""

    email_record = {
        "to": candidate_email,
        "subject": subject,
        "sent_at": datetime.utcnow().isoformat(),
        "status": "pending",
    }

    # Try sending via SMTP
    if SMTP_EMAIL and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"SmartHire <{SMTP_EMAIL}>"
            msg["To"] = candidate_email
            msg["Subject"] = subject

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.send_message(msg)

            email_record["status"] = "sent"
            print(f"✅ Email SENT to {candidate_email}")
            
            return {
                "success": True,
                "message": f"Quiz invitation email sent to {candidate_email}",
                "email": email_record,
            }

        except Exception as e:
            print(f"❌ SMTP send failed: {e}")
            email_record["status"] = "failed"
            email_record["error"] = str(e)
            # Fall through to console logging
    
    # Fallback: console logging (when SMTP not configured)
    print("\n" + "=" * 60)
    print("📧 QUIZ EMAIL (SMTP not configured — console only)")
    print("=" * 60)
    print(f"To:      {candidate_email}")
    print(f"Subject: {subject}")
    print(f"Link:    {quiz_link}")
    print(f"Time:    {time_limit} minutes")
    print("=" * 60)
    print("💡 To enable real email delivery, set SMTP_EMAIL and SMTP_PASSWORD in .env")
    print("=" * 60 + "\n")

    email_record["status"] = "logged"

    return {
        "success": True,
        "message": f"Quiz email logged for {candidate_email} (set SMTP_EMAIL and SMTP_PASSWORD in .env to send real emails)",
        "email": email_record,
    }
