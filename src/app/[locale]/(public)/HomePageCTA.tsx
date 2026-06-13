'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/Button';
import { Globe, ArrowRight } from 'lucide-react';

export function HeroAuditInput({ 
  placeholder, 
  cta, 
  microcopy, 
  locale 
}: { 
  placeholder: string; 
  cta: string; 
  microcopy: string;
  locale: string;
}) {
  const [domain, setDomain] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    // Basic cleaning: remove http/https and trailing slashes
    let cleaned = domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    // Validate it looks like a domain (has at least one dot)
    if (!cleaned.includes('.') || cleaned.length < 4) {
      return;
    }

    posthog.capture('homepage_audit_submitted', { 
      domain: cleaned,
      locale: locale
    });

    // Save to session storage as secondary backup
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('pending_audit_domain', cleaned);
    }

    router.push(`/register?domain=${encodeURIComponent(cleaned)}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-in-up stagger-3">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-0 bg-brand-secondary/20 rounded-xl blur-xl group-focus-within:bg-brand-secondary/30 transition-colors duration-500" />
        <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-white border border-brand-border rounded-xl shadow-lg focus-within:border-brand-secondary/50 transition-[border-color,shadow] duration-200">
          <div className="flex-1 flex items-center px-4 gap-3">
            <Globe className="w-5 h-5 text-brand-text-muted" aria-hidden="true" />
            <input
              type="text"
              name="domain"
              autoComplete="url"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="w-full py-3 bg-transparent text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none text-base sm:text-lg"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-auto px-8 bg-brand-secondary hover:bg-brand-secondary/90 text-brand-text-primary font-bold rounded-lg"
          >
            {cta}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </form>
      <p className="mt-4 text-xs font-medium text-brand-text-muted tracking-wide uppercase">
        {microcopy}
      </p>
    </div>
  );
}

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
