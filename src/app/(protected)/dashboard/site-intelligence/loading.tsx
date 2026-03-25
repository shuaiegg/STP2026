import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function SiteIntelligenceLoading() {
  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>

      {/* Body - Site Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
