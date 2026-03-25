import { SkeletonBlock } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-10">
      <SkeletonBlock className="h-10 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1 space-y-4">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-gray-100 rounded-xl space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ))}
            <SkeletonBlock className="h-10 w-24 ml-auto rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
