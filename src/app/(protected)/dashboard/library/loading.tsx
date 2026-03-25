import { SkeletonBlock } from "@/components/ui/skeleton"

export default function LibraryLoading() {
  return (
    <div className="space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <SkeletonBlock className="h-12 w-64 italic" />
          <SkeletonBlock className="h-5 w-80" />
        </div>
        
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-64 rounded-xl" />
          <SkeletonBlock className="h-10 w-12 rounded-xl" />
        </div>
      </div>

      {/* Article List Skeleton (5 rows) */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
