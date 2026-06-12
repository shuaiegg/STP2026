'use client';

import { Link } from '@/i18n/navigation';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/Button';

export function HeroCTA({ primary, secondary, microText }: {
  primary: string;
  secondary: string;
  microText: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 mb-12 animate-slide-in-up stagger-3">
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Link href="/blog" className="w-full sm:w-auto">
          <Button
            as="span"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => posthog.capture('homepage_cta_clicked', { cta: 'primary' })}
          >
            {primary}
          </Button>
        </Link>
        <Link href="/tools" className="w-full sm:w-auto">
          <Button
            as="span"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => posthog.capture('homepage_cta_clicked', { cta: 'secondary' })}
          >
            {secondary}
          </Button>
        </Link>
      </div>
      <p className="text-xs text-brand-text-muted mt-2">{microText}</p>
    </div>
  );
}

export function BottomCTA({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <Link href="/tools" className="w-full sm:w-auto">
        <Button
          as="span"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto text-white"
          onClick={() => posthog.capture('homepage_cta_clicked', { cta: 'bottom_primary' })}
        >
          {primary}
        </Button>
      </Link>
      <Link href="/blog" className="w-full sm:w-auto">
        <Button
          as="span"
          variant="outline"
          size="lg"
          className="w-full sm:w-auto text-white border-white/20 hover:bg-white/10 hover:text-white"
          onClick={() => posthog.capture('homepage_cta_clicked', { cta: 'bottom_secondary' })}
        >
          {secondary}
        </Button>
      </Link>
    </div>
  );
}
