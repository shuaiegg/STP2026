import { cn } from "@/lib/utils"

export function SkeletonBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse bg-slate-100 rounded-lg", className)}
      {...props}
    />
  )
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("motion-safe:animate-pulse bg-slate-100 rounded-lg h-32 w-full", className)}
      {...props}
    />
  )
}
