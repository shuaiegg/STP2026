export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-36 bg-brand-surface-alt rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-80 bg-brand-surface-alt rounded-lg animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-4 w-24 bg-brand-surface-alt rounded animate-pulse" />
          {[1, 2].map((j) => (
            <div key={j} className="h-28 rounded-xl bg-brand-surface-alt animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
