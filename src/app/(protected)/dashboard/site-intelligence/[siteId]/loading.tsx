import { SkeletonBlock } from "@/components/ui/skeleton"

export default function SiteWorkbenchLoading() {
  return (
    <div className="space-y-6">
      {/* SiteHeader Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>

      {/* Tab bar Skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <SkeletonBlock className="h-10 w-20" />
          <SkeletonBlock className="h-10 w-20" />
          <SkeletonBlock className="h-10 w-20" />
          <SkeletonBlock className="h-10 w-20" />
        </div>
      </div>

      {/* Panel Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-96 w-full" />
        </div>
        <div className="space-y-6">
          <SkeletonBlock className="h-48 w-full" />
          <SkeletonBlock className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}
