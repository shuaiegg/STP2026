import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* Header & Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-10 w-48 italic" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        
        <SkeletonCard className="bg-slate-900 min-w-[240px] h-24 rounded-xl" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-64 rounded-xl" />
        <SkeletonCard className="h-64 rounded-xl" />
        <SkeletonCard className="h-64 rounded-xl" />
      </div>

      {/* Transaction History Skeleton */}
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-48" />
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex justify-between items-center">
              <div className="flex gap-4">
                <SkeletonBlock className="h-6 w-12 rounded" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-48" />
                  <SkeletonBlock className="h-3 w-32" />
                </div>
              </div>
              <SkeletonBlock className="h-5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
