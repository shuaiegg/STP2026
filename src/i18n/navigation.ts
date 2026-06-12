import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 公开站内部链接必须使用这里的 Link / redirect / useRouter，
// 以保证 locale 前缀自动正确（en 无前缀，zh 加 /zh）
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
