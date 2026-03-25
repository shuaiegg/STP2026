import { SkeletonBlock } from "@/components/ui/skeleton"

export default function SiteIntelligenceLoading() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-5 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonBlock key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
