import { SkeletonBlock } from "@/components/ui/skeleton"
import { StrategyBoardSkeleton } from "@/components/ui/panel-skeleton"

export default function SiteDetailLoading() {
  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-10 w-48 rounded-xl" />
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex flex-col gap-1">
                <SkeletonBlock className="h-2 w-12" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
              <div className="flex flex-col gap-1">
                <SkeletonBlock className="h-2 w-12" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {[...Array(6)].map((_, i) => (
          <SkeletonBlock key={i} className="h-12 w-24 mx-2 border-b-2 border-transparent" />
        ))}
      </div>

      {/* Panel Content Skeleton */}
      <div className="pt-4">
        <StrategyBoardSkeleton />
      </div>
    </div>
  )
}
