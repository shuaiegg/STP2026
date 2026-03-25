import { SkeletonBlock } from "@/components/ui/skeleton"

export default function OnboardingLoading() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 p-12 bg-white border border-slate-100 rounded-3xl shadow-xl">
        <div className="space-y-4 flex flex-col items-center">
            <SkeletonBlock className="h-6 w-32 rounded-full" />
            <SkeletonBlock className="h-10 w-64" />
            <SkeletonBlock className="h-6 w-80" />
        </div>
        <div className="space-y-6">
            <SkeletonBlock className="h-16 w-full rounded-2xl" />
            <SkeletonBlock className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
