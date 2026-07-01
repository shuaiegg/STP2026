import { Suspense } from 'react';
import { GEOWriterPageContent } from '@/app/[locale]/(public)/tools/geo-writer/page';

export default function DashboardGeoWriterPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[80vh]">
                <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
            </div>
        }>
            <GEOWriterPageContent isDashboard />
        </Suspense>
    );
}
