import { SkeletonBlock } from "@/components/ui/skeleton"

export default function ProtectedLoading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Skeleton Placeholder */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 hidden lg:block">
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-3 mb-12 px-2">
            <SkeletonBlock className="w-10 h-10 rounded-lg" />
            <SkeletonBlock className="h-6 w-24" />
          </div>
          <nav className="flex-1 space-y-4">
            <SkeletonBlock className="h-4 w-20 ml-4 mb-6" />
            {[...Array(5)].map((_, i) => (
              <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area Placeholder */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton Placeholder */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 px-10 flex items-center justify-between">
          <SkeletonBlock className="h-10 w-80 rounded-xl hidden sm:block" />
          <div className="flex items-center gap-6">
            <SkeletonBlock className="h-8 w-16 rounded-xl" />
            <SkeletonBlock className="w-12 h-12 rounded-xl" />
          </div>
        </header>

        {/* Content Skeleton Placeholder */}
        <main className="flex-1 p-10">
          <div className="space-y-6">
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
    </div>
  )
}
