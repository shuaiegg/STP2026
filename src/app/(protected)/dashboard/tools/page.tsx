import { redirect } from 'next/navigation';

// 只有一个生产工具（geo-writer）→ 工具中转页已去除，"生产"直达写作。
// 保留此重定向以兜住旧链接 / 直接访问 /dashboard/tools。
export default function ToolsIndexRedirect() {
    redirect('/dashboard/tools/geo-writer');
}
