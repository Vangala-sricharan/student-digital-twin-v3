/**
 * Formats a number according to the Indian Numbering System with the ₹ symbol.
 * Example: 299 -> ₹299, 1499 -> ₹1,499, 12999 -> ₹12,999, 100000 -> ₹1,00,000
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Convert to integer string for standard INR grouping
  const parts = absAmount.toString().split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1].slice(0, 2)}` : '';
  
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = `${formattedOther},${lastThree}`;
  }
  
  return `${isNegative ? '-' : ''}₹${integerPart}${decimalPart}`;
}

export interface PlanDisplayInfo {
  name: string;
  priceFormatted: string;
  badgeLabel: string;
  fullLabel: string;
  isPro: boolean;
  isMonthly: boolean;
  isAnnual: boolean;
  isPending: boolean;
}

export function getSubscriptionPlanInfo(
  profile: { plan?: string; billingCycle?: string; subscriptionStatus?: string } | null | undefined,
  isDemo: boolean = false
): PlanDisplayInfo {
  if (isDemo) {
    return {
      name: 'STUDENT PRO (DEMO)',
      priceFormatted: formatINR(1499),
      badgeLabel: 'DEMO PRO',
      fullLabel: 'Student Pro Demo Showcase — ACTIVE',
      isPro: true,
      isMonthly: false,
      isAnnual: true,
      isPending: false,
    };
  }

  if (!profile) {
    return {
      name: 'FREE PLAN',
      priceFormatted: formatINR(0),
      badgeLabel: `FREE PLAN (${formatINR(0)})`,
      fullLabel: `Free Plan (${formatINR(0)})`,
      isPro: false,
      isMonthly: false,
      isAnnual: false,
      isPending: false,
    };
  }

  const isPending = profile.subscriptionStatus === 'pending_verification';
  const isMonthly =
    profile.plan === 'pro_monthly' ||
    (profile.plan === 'pro' && profile.billingCycle === 'monthly') ||
    profile.billingCycle === 'monthly';

  const isAnnual =
    profile.plan === 'pro_annual' ||
    profile.plan === 'annual' ||
    (profile.plan === 'pro' && (profile.billingCycle === 'annual' || !profile.billingCycle));

  const isPro = isMonthly || isAnnual || profile.plan === 'pro' || profile.subscriptionStatus === 'active';

  if (isPending) {
    const amount = isMonthly ? 499 : 1499;
    return {
      name: isMonthly ? 'STUDENT PRO — MONTHLY' : 'STUDENT PRO — ANNUAL',
      priceFormatted: formatINR(amount),
      badgeLabel: `STUDENT PRO (${formatINR(amount)}) — PENDING`,
      fullLabel: `Student Pro (${formatINR(amount)}) — Verification Pending`,
      isPro: true,
      isMonthly,
      isAnnual: !isMonthly,
      isPending: true,
    };
  }

  if (isMonthly) {
    return {
      name: 'STUDENT PRO — MONTHLY',
      priceFormatted: formatINR(499),
      badgeLabel: `STUDENT PRO — MONTHLY (${formatINR(499)})`,
      fullLabel: `Student Pro Monthly — ACTIVE (${formatINR(499)}/mo)`,
      isPro: true,
      isMonthly: true,
      isAnnual: false,
      isPending: false,
    };
  }

  if (isAnnual || profile.plan === 'pro') {
    return {
      name: 'STUDENT PRO — ANNUAL',
      priceFormatted: formatINR(1499),
      badgeLabel: `STUDENT PRO — ANNUAL (${formatINR(1499)})`,
      fullLabel: `Student Pro Annual — ACTIVE (${formatINR(1499)}/yr)`,
      isPro: true,
      isMonthly: false,
      isAnnual: true,
      isPending: false,
    };
  }

  return {
    name: 'FREE PLAN',
    priceFormatted: formatINR(0),
    badgeLabel: `FREE PLAN (${formatINR(0)})`,
    fullLabel: `Free Plan (${formatINR(0)})`,
    isPro: false,
    isMonthly: false,
    isAnnual: false,
    isPending: false,
  };
}

