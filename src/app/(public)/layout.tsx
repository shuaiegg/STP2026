import { MainLayout } from "@/components/layout/MainLayout";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainLayout>{children}</MainLayout>;
}
