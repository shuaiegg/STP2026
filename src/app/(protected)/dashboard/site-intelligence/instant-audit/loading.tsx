import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function InstantAuditLoading() {
  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-12" />
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Area Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <SkeletonCard className="h-[600px] rounded-3xl" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-24 bg-slate-100" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    </div>
  )
}
