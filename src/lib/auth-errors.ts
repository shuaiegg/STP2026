/**
 * Translate Better Auth error messages to Chinese
 */
export function translateAuthError(errorMsg: string): string {
    const errorMap: Record<string, string> = {
        "Invalid origin": "无效的请求来源（请尝试刷新页面）",
        "Invalid email or password": "邮箱或密码错误",
        "User not found": "找不到该用户",
        "Email already in use": "该邮箱已被注册",
        "Something went wrong": "发生了一些错误，请重试",
        "Invalid credentials": "身份验证凭据无效",
        "Session expired": "会话已过期，请重新登录",
    };

    return errorMap[errorMsg] || errorMsg;
}
