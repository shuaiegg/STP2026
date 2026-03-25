import { SkeletonBlock } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      {/* Top Nav Skeleton Placeholder (Matching Shell Height) */}
      <nav className="h-14 border-b border-gray-200 bg-white -mx-6 md:-mx-10 px-4 flex items-center justify-between -mt-6 md:-mt-10 mb-6">
        <div className="flex items-center gap-6">
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
          <SkeletonBlock className="h-6 w-24 hidden sm:block" />
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <SkeletonBlock className="h-5 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-8 w-16 rounded-full" />
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-10 w-64" />
          <SkeletonBlock className="h-5 w-96" />
        </div>

        {/* Metrics Grid (3x2 as per task 2.2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
