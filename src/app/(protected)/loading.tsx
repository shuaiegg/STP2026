import { SkeletonBlock } from "@/components/ui/skeleton"

export default function ProtectedLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Nav Skeleton Placeholder */}
      <nav className="h-14 border-b border-gray-200 bg-white sticky top-0 z-40 px-4 flex items-center justify-between">
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

      {/* Main Content Area Placeholder */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <SkeletonBlock className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonBlock className="h-32 w-full rounded-xl" />
            <SkeletonBlock className="h-32 w-full rounded-xl" />
            <SkeletonBlock className="h-32 w-full rounded-xl" />
          </div>
          <SkeletonBlock className="h-96 w-full rounded-xl" />
        </div>
      </main>
    </div>
  )
}
