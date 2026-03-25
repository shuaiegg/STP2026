import { SkeletonBlock, SkeletonCard } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 space-y-4">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-12 w-64" />
        <SkeletonBlock className="h-5 w-80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <SkeletonCard className="h-[500px] rounded-xl" />
        </div>
        <div className="md:col-span-4 space-y-6">
          <SkeletonCard className="h-48 rounded-xl border-dashed" />
          <SkeletonCard className="h-32 rounded-xl bg-slate-50" />
        </div>
      </div>
    </div>
  )
}
