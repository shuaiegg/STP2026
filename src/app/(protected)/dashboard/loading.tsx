import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-5 w-96" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-[400px] w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <SkeletonBlock className="h-8 w-32" />
          <div className="space-y-4">
            <SkeletonBlock className="h-24 w-full rounded-xl" />
            <SkeletonBlock className="h-24 w-full rounded-xl" />
            <SkeletonBlock className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
