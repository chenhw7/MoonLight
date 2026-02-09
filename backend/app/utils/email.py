"""邮件服务模块。

提供异步邮件发送功能，支持QQ邮箱SMTP。
"""

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


async def send_verification_email(to_email: str, code: str, code_type: str) -> bool:
    """发送验证码邮件。

    使用QQ邮箱SMTP服务发送验证码到用户邮箱。

    Args:
        to_email: 收件人邮箱地址
        code: 验证码
        code_type: 验证码类型 (register/reset_password)

    Returns:
        bool: 发送成功返回True，否则返回False

    Example:
        >>> success = await send_verification_email("user@example.com", "123456", "register")
        >>> print(success)
        True
    """
    # 开发环境直接返回True（不发送真实邮件）
    if settings.is_development and not settings.email_enabled:
        logger.info(
            "Development mode: email not sent",
            to_email=to_email,
            code=code,
            code_type=code_type,
        )
        return True

    try:
        # 构建邮件内容
        subject = get_email_subject(code_type)
        content = get_email_content(code, code_type)

        msg = MIMEMultipart()
        msg["From"] = settings.email_sender
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(content, "html", "utf-8"))

        # 发送邮件
        # 注意：QQ邮箱465端口使用SSL，需要start_tls=False
        await aiosmtplib.send(
            msg,
            hostname=settings.email_smtp_host,
            port=settings.email_smtp_port,
            start_tls=False,  # 465端口使用SSL不需要STARTTLS
            use_tls=True,     # 使用SSL/TLS加密连接
            username=settings.email_username,
            password=settings.email_password,
        )

        logger.info(
            "Verification email sent successfully",
            to_email=to_email,
            code_type=code_type,
        )
        return True

    except Exception as e:
        logger.error(
            "Failed to send verification email",
            to_email=to_email,
            error=str(e),
            exc_info=True,
        )
        return False


def get_email_subject(code_type: str) -> str:
    """获取邮件主题。

    Args:
        code_type: 验证码类型

    Returns:
        str: 邮件主题
    """
    subjects = {
        "register": "MoonLight - 注册验证码",
        "reset_password": "MoonLight - 密码重置验证码",
    }
    return subjects.get(code_type, "MoonLight - 验证码")


def get_email_content(code: str, code_type: str) -> str:
    """获取邮件内容。

    Args:
        code: 验证码
        code_type: 验证码类型

    Returns:
        str: HTML格式的邮件内容
    """
    titles = {
        "register": "欢迎注册 MoonLight",
        "reset_password": "密码重置",
    }
    title = titles.get(code_type, "验证码")

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .title {{
                font-size: 24px;
                color: #333333;
                margin-bottom: 10px;
            }}
            .code {{
                font-size: 36px;
                font-weight: bold;
                color: #4a90d9;
                text-align: center;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 8px;
                margin: 20px 0;
                letter-spacing: 8px;
            }}
            .footer {{
                text-align: center;
                color: #999999;
                font-size: 12px;
                margin-top: 30px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title">{title}</div>
            </div>
            <p>您好，</p>
            <p>您的验证码是：</p>
            <div class="code">{code}</div>
            <p>此验证码将在10分钟后过期，请勿泄露给他人。</p>
            <div class="footer">
                <p>此邮件由 MoonLight 系统自动发送，请勿回复。</p>
            </div>
        </div>
    </body>
    </html>
    """
