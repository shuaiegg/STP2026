import { SkeletonBlock } from "@/components/ui/skeleton"

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
