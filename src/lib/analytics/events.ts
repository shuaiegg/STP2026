// Activation funnel event names — single source of truth
export const EVENTS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_COACH_MOMENT_VIEWED: 'first_coach_moment_viewed',
  FIRST_ACTION_STARTED: 'first_action_started',
  FIRST_MEANINGFUL_ACTION_COMPLETED: 'first_meaningful_action_completed',
  DASHBOARD_RETURNED: 'dashboard_returned',
} as const;

export type ActivationEvent = (typeof EVENTS)[keyof typeof EVENTS];

// Typed event property shapes
export interface FirstMeaningfulActionProps {
  action_type: 'generated' | 'published';
  days_since_signup: number;
  credits_spent: number;
}

export interface DashboardReturnedProps {
  days_since_signup: number;
  is_return: boolean;
  landing_surface: 'growth_home';
}

export interface OnboardingCompletedProps {
  domain: string;
  competitors_count: number;
  has_dna: boolean;
  days_since_signup: number;
}

// Server-side helper — use user.createdAt from DB, not session.
// Accepts Date OR string: values served from unstable_cache come back JSON-serialized
// (Date → string), so coerce defensively and guard against invalid dates.
export function daysSinceSignup(user: { createdAt: Date | string }): number {
  const ts = user.createdAt instanceof Date
    ? user.createdAt.getTime()
    : new Date(user.createdAt).getTime();
  if (Number.isNaN(ts)) return 0;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}
