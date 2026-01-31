"""安全工具模块。

提供密码哈希、JWT 令牌生成和验证等安全功能。
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# 密码哈希上下文
def _truncate_password(password: str) -> str:
    """截断密码到 72 字节以内（bcrypt 限制）。
    
    bcrypt 算法只使用前 72 字节，超过部分会被忽略。
    这里我们截断密码以避免触发 bcrypt 的警告。
    
    Args:
        password: 原始密码
        
    Returns:
        str: 截断后的密码（最多 72 字节）
    """
    # bcrypt 使用 UTF-8 编码，限制 72 字节
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        return password_bytes[:72].decode('utf-8', errors='ignore')
    return password


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 配置
settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码。

    使用 bcrypt 算法验证明文密码是否与哈希匹配。

    Args:
        plain_password: 明文密码
        hashed_password: 哈希后的密码

    Returns:
        bool: 验证成功返回 True，否则返回 False

    Example:
        >>> is_valid = verify_password("password123", hashed_password)
        >>> print(is_valid)
        True
    """
    # 截断密码以符合 bcrypt 限制
    truncated_password = _truncate_password(plain_password)
    return pwd_context.verify(truncated_password, hashed_password)


def hash_password(password: str) -> str:
    """哈希密码。

    使用 bcrypt 算法对密码进行哈希处理。

    Args:
        password: 明文密码

    Returns:
        str: 哈希后的密码

    Example:
        >>> hashed = hash_password("password123")
        >>> print(hashed)
        '$2b$12$...'
    """
    # 截断密码以符合 bcrypt 限制
    truncated_password = _truncate_password(password)
    return pwd_context.hash(truncated_password)


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌。

    生成 JWT 访问令牌，用于用户认证。

    Args:
        data: 要编码到令牌中的数据，通常包含用户 ID
        expires_delta: 过期时间增量，默认使用配置中的值

    Returns:
        str: JWT 令牌字符串

    Example:
        >>> token = create_access_token({"sub": "user@example.com"})
        >>> print(token)
        'eyJhbGciOiJIUzI1NiIs...'
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm="HS256"
    )

    logger.debug("Access token created", user_id=data.get("sub"))
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """创建刷新令牌。

    生成 JWT 刷新令牌，用于获取新的访问令牌。

    Args:
        data: 要编码到令牌中的数据，通常包含用户 ID

    Returns:
        str: JWT 刷新令牌字符串

    Example:
        >>> token = create_refresh_token({"sub": "user@example.com"})
        >>> print(token)
        'eyJhbGciOiJIUzI1NiIs...'
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm="HS256"
    )

    logger.debug("Refresh token created", user_id=data.get("sub"))
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """解码 JWT 令牌。

    验证并解码 JWT 令牌，返回其中的数据。

    Args:
        token: JWT 令牌字符串

    Returns:
        Optional[Dict[str, Any]]: 解码后的数据，验证失败返回 None

    Example:
        >>> payload = decode_token(token)
        >>> print(payload)
        {'sub': 'user@example.com', 'exp': 1234567890, 'type': 'access'}
    """
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=["HS256"]
        )
        return payload
    except JWTError as e:
        logger.warning("Token decode failed", error=str(e))
        return None


def create_token_pair(user_id: str, email: str) -> Tuple[str, str]:
    """创建令牌对。

    同时生成访问令牌和刷新令牌。

    Args:
        user_id: 用户 ID
        email: 用户邮箱

    Returns:
        Tuple[str, str]: (访问令牌, 刷新令牌)

    Example:
        >>> access_token, refresh_token = create_token_pair("123", "user@example.com")
    """
    token_data = {"sub": str(user_id), "email": email}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    logger.info(
        "Token pair created",
        user_id=user_id,
        email=email,
    )

    return access_token, refresh_token
