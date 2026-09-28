import type { AppState } from './app';

/**
 * Log-ins for presenting the prototype. Each one is the same Figma user (samuelessence344);
 * only the plan differs, and the trial-ended account opens the "Your 7-day trial has ended" sheet.
 * They are listed in the README and the presentation guide.
 */
export const DEMO_PASSWORD = 'bookclub24';

export type DemoAccount = { plan: AppState['plan']; sheet?: AppState['sheet'] };

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  'free@example.com': { plan: 'free' },
  'trial@example.com': { plan: 'trial' },
  'trialended@example.com': { plan: 'free', sheet: 'trial-manage' },
  'premium@example.com': { plan: 'premium' },
};
