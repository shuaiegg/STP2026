import { SkeletonBlock } from "@/components/ui/skeleton"

export function TopNavSkeleton() {
  return (
    <nav className="h-14 border-b border-gray-200 bg-white -mx-6 md:-mx-10 px-4 flex items-center justify-between -mt-6 md:-mt-10 mb-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
          <SkeletonBlock className="h-6 w-24 hidden sm:block" />
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
        <SkeletonBlock className="h-5 w-32" />
      </div>
      <div className="hidden md:flex items-center gap-8">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-12" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-8 w-16 rounded-full" />
        <SkeletonBlock className="w-8 h-8 rounded-lg" />
      </div>
    </nav>
  )
}
