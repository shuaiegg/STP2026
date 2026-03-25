import { SkeletonBlock, SkeletonCard } from "./skeleton"

export function StrategyBoardSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonBlock className="h-64 w-full" />
    </div>
  )
}

export function OverviewPanelSkeleton() {
  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
      <SkeletonBlock className="h-[400px] w-full" />
    </div>
  )
}

export function CompetitorsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-12 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  )
}

export function PerformancePanelSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
      <SkeletonBlock className="h-[500px] w-full" />
    </div>
  )
}

export function AuditHistoryPanelSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-10 w-full" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export function IntegrationsPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-40" />
    </div>
  )
}
