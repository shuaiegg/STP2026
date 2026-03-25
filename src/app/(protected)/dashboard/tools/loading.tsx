import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function ToolsLoading() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <SkeletonBlock className="h-12 w-64 italic" />
        <SkeletonBlock className="h-5 w-80" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="h-72 rounded-xl" />
        ))}
      </div>
      
      <div className="max-w-2xl mx-auto">
        <SkeletonCard className="h-48 rounded-xl border-dashed" />
      </div>
    </div>
  )
}
