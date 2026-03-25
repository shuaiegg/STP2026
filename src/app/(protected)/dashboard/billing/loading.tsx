import { SkeletonBlock } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-10 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonBlock className="h-48 w-full rounded-xl" />
        <SkeletonBlock className="h-48 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
