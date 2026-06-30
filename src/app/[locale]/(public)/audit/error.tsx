'use client';

import { Button } from '@/components/ui/Button';

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p className="font-bold text-brand-text-primary mb-2">Something went wrong</p>
      <p className="text-sm text-brand-text-muted mb-6">{error.message}</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
