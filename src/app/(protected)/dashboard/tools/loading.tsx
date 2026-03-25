import { SkeletonBlock } from "@/components/ui/skeleton"

export default function ToolsLoading() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <SkeletonBlock key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
