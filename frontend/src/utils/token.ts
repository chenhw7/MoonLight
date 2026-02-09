/**
 * Token 调试工具
 * 
 * 帮助检查和调试 JWT token 的有效性
 */

/**
 * 解析 JWT token
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp 是秒级时间戳，需要乘以 1000 转为毫秒
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * 获取 token 信息
 */
export function getTokenInfo(): {
  hasToken: boolean;
  isExpired: boolean;
  payload: any;
  expiresIn?: string;
} {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return {
      hasToken: false,
      isExpired: true,
      payload: null,
    };
  }

  const payload = parseJWT(token);
  const expired = isTokenExpired(token);
  
  let expiresIn = '';
  if (payload && payload.exp) {
    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    const diff = expirationTime - now;
    
    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        expiresIn = `${days}天${hours % 24}小时`;
      } else if (hours > 0) {
        expiresIn = `${hours}小时${minutes % 60}分钟`;
      } else {
        expiresIn = `${minutes}分钟`;
      }
    } else {
      expiresIn = '已过期';
    }
  }

  return {
    hasToken: true,
    isExpired: expired,
    payload,
    expiresIn,
  };
}

/**
 * 打印 token 调试信息到控制台
 */
export function debugToken(): void {
  const info = getTokenInfo();
  
  console.group('🔐 Token Debug Info');
  console.log('Has Token:', info.hasToken);
  console.log('Is Expired:', info.isExpired);
  console.log('Expires In:', info.expiresIn);
  console.log('Payload:', info.payload);
  
  if (info.payload) {
    console.log('User ID:', info.payload.sub);
    console.log('Email:', info.payload.email);
    console.log('Issued At:', new Date(info.payload.iat * 1000).toLocaleString());
    console.log('Expires At:', new Date(info.payload.exp * 1000).toLocaleString());
  }
  
  console.groupEnd();
}
