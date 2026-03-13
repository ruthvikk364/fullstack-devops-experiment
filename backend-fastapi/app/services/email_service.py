"""
Email service — sends the fitness plan PDF via AWS SES SMTP.
"""

import asyncio
import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings
from app.utils.logger import get_logger

log = get_logger(__name__)


def _build_email_html(user_name: str) -> str:
    """Build the HTML email body."""
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ margin: 0; padding: 0; background: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }}
  .wrapper {{ max-width: 600px; margin: 0 auto; background: #ffffff; }}
  .header {{
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 40px 32px; text-align: center;
  }}
  .header h1 {{ color: #10b981; font-size: 32px; margin: 0 0 4px 0; }}
  .header p {{ color: #94a3b8; font-size: 14px; margin: 0; }}
  .body {{ padding: 32px; color: #374151; font-size: 15px; line-height: 1.8; }}
  .body h2 {{ color: #0f172a; font-size: 20px; margin: 0 0 16px 0; }}
  .highlight {{ color: #10b981; font-weight: 600; }}
  .features {{
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
    padding: 20px 24px; margin: 20px 0;
  }}
  .features ul {{ margin: 0; padding: 0 0 0 20px; }}
  .features li {{ margin-bottom: 8px; color: #166534; }}
  .cta {{
    display: inline-block; background: #10b981; color: #ffffff; font-weight: 600;
    padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;
    margin: 16px 0;
  }}
  .motivation {{
    background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px;
    border-radius: 0 8px 8px 0; margin: 20px 0; color: #92400e; font-style: italic;
  }}
  .divider {{ border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }}
  .signature {{ color: #6b7280; font-size: 14px; }}
  .signature strong {{ color: #0f172a; }}
  .footer {{
    background: #f8fafc; padding: 20px 32px; text-align: center;
    color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;
  }}
  .footer a {{ color: #10b981; text-decoration: none; }}
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <h1>TrainFree</h1>
    <p>AI-Powered Personal Fitness Coach</p>
  </div>

  <div class="body">
    <h2>Hi {user_name},</h2>

    <p>
      Welcome to <span class="highlight">TrainFree</span> — and thank you for starting your fitness journey with us! 💪
    </p>

    <p>
      Based on the information you shared with <span class="highlight">Mika, your AI fitness coach</span>,
      we've created a <strong>personalized fitness and nutrition plan</strong> tailored to your goals,
      lifestyle, and food preferences.
    </p>

    <div class="features">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #047857;">Your plan includes:</p>
      <ul>
        <li>A structured workout routine designed for your goals</li>
        <li>A personalized diet plan with balanced nutrients</li>
        <li>Daily calorie and protein targets</li>
        <li>Simple meal recommendations you can follow easily</li>
      </ul>
    </div>

    <p>
      You can find your <strong>detailed fitness and diet plan attached as a PDF</strong> in this email. 📎
    </p>

    <div class="motivation">
      "Fitness is not about perfection, it's about <strong>consistency</strong>.
      Even small daily improvements lead to massive long-term results."
    </div>

    <p>
      Our AI coach <span class="highlight">Mika</span> will continue supporting you on your journey
      with guidance, motivation, and smart adjustments to your plan as you progress.
    </p>

    <p>
      If you ever have questions or feedback, feel free to reply to this email — we'd love to hear from you.
    </p>

    <p>Wishing you strength, discipline, and great results ahead.</p>

    <hr class="divider">

    <div class="signature">
      <p>Best regards,</p>
      <p><strong>Veda</strong><br>Co-Founder<br><strong>TrainFree</strong></p>
    </div>
  </div>

  <div class="footer">
    <p>
      <a href="https://beyondscale.tech">beyondscale.tech</a> ·
      Built with ❤️ by BeyondScale
    </p>
    <p>You're receiving this because you signed up for a TrainFree fitness plan.</p>
  </div>

</div>
</body>
</html>"""


def _send_email_sync(to_email: str, user_name: str, pdf_path: str) -> bool:
    """Send the email with PDF attachment via SES SMTP (blocking)."""
    msg = MIMEMultipart("mixed")
    msg["From"] = f"{settings.SES_FROM_NAME} <{settings.SES_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = f"Your Personalized Fitness Plan is Ready, {user_name}! 💪"

    # HTML body
    html_body = _build_email_html(user_name)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # PDF attachment
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            attachment = MIMEApplication(f.read(), _subtype="pdf")
            filename = os.path.basename(pdf_path)
            attachment.add_header("Content-Disposition", "attachment", filename=filename)
            msg.attach(attachment)
        log.info("PDF attached: %s", pdf_path)

    try:
        with smtplib.SMTP(settings.SES_SMTP_HOST, settings.SES_SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SES_SMTP_USER, settings.SES_SMTP_PASSWORD)
            server.send_message(msg)

        log.info("Email sent to %s via SES", to_email)
        return True

    except Exception as e:
        log.error("Email send failed to %s: %s", to_email, e)
        return False


async def send_fitness_plan_email(to_email: str, user_name: str, pdf_path: str) -> bool:
    """Async wrapper — runs the SMTP send in a thread to avoid blocking."""
    if not settings.SES_SMTP_USER or not settings.SES_SMTP_PASSWORD:
        log.warning("SES credentials not configured, skipping email")
        return False

    if not to_email:
        log.warning("No email address provided, skipping email")
        return False

    return await asyncio.to_thread(_send_email_sync, to_email, user_name, pdf_path)
