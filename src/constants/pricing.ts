import { formatINR } from '../utils/formatters';

export interface PlanFeature {
  text: string;
  included: boolean;
  isProOnly?: boolean;
}

export interface PricingPlan {
  id: 'free' | 'pro' | 'institutional';
  name: string;
  badge: string;
  badgeVariant: 'slate' | 'blue' | 'purple' | 'emerald';
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscountPercent: string;
  annualDiscountText: string;
  monthlyDisplay: string;
  annualDisplay: string;
  billingPeriod: string;
  features: PlanFeature[];
  ctaLabel: string;
  popular?: boolean;
}

export const PRICING_PLANS: Record<'free' | 'pro' | 'institutional', PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    badge: 'Starter',
    badgeVariant: 'slate',
    description: 'Complete digital twin foundation for all engineering students.',
    monthlyPrice: 0,
    annualPrice: 0,
    annualDiscountPercent: '0%',
    annualDiscountText: 'Free forever for every student',
    monthlyDisplay: `${formatINR(0)} / forever`,
    annualDisplay: `${formatINR(0)} / forever`,
    billingPeriod: 'forever',
    popular: false,
    ctaLabel: 'Get Started Free',
    features: [
      { text: 'Full Student Digital Twin profile', included: true },
      { text: 'Verified Skill & Project cataloging', included: true },
      { text: 'Academic Coursework & syllabus mapping', included: true },
      { text: 'AI Career Assistant & mentorship chat', included: true },
      { text: 'Live ATS Resume Builder & PDF export', included: true },
      { text: 'GitHub Profile & Repository Audit', included: true },
      { text: 'LinkedIn Profile Readiness Audit', included: true },
      { text: 'Light & Dark responsive OS access', included: true },
    ],
  },
  pro: {
    id: 'pro',
    name: 'Student Pro',
    badge: 'Pro Twin',
    badgeVariant: 'blue',
    description: 'Advanced AI intelligence, deep gap analysis, role benchmarks, and predictive career roadmaps.',
    monthlyPrice: 499,
    annualPrice: 1499,
    annualDiscountPercent: '75%',
    annualDiscountText: 'Save 75% (₹4,489 savings / year)',
    monthlyDisplay: `${formatINR(499)} / month`,
    annualDisplay: `${formatINR(1499)} / year`,
    billingPeriod: 'per user',
    popular: true,
    ctaLabel: 'Upgrade to Student Pro',
    features: [
      { text: 'Everything included in Free Plan', included: true },
      { text: 'AI Career Intelligence & deep gap detection', included: true, isProOnly: true },
      { text: 'Continuous Role Benchmark simulations', included: true, isProOnly: true },
      { text: 'Priority 30-60-90 day Career Roadmap generator', included: true, isProOnly: true },
      { text: 'Full Project Architecture & Quality Analyzer', included: true, isProOnly: true },
      { text: 'Syllabus-to-Industry Alignment Engine', included: true, isProOnly: true },
      { text: 'Internship Placement Readiness evaluation', included: true, isProOnly: true },
      { text: 'Interactive Career Simulator "What-If" Trajectory Engine', included: true, isProOnly: true },
    ],
  },
  institutional: {
    id: 'institutional',
    name: 'Campus / Institutional',
    badge: 'Enterprise',
    badgeVariant: 'purple',
    description: 'For colleges, universities, department cohorts, and placement cells.',
    monthlyPrice: 12999,
    annualPrice: 12999,
    annualDiscountPercent: 'Custom',
    annualDiscountText: 'Department & cohort-wide licensing',
    monthlyDisplay: `${formatINR(12999)} / cohort / year`,
    annualDisplay: `${formatINR(12999)} / cohort / year`,
    billingPeriod: 'per cohort / year',
    popular: false,
    ctaLabel: 'Contact Institutional',
    features: [
      { text: 'Multi-Student Twin cohort dashboard', included: true },
      { text: 'Campus placement cell readiness analytics', included: true },
      { text: 'Bulk syllabus & department curriculum ingestion', included: true },
      { text: 'Automated skill gap reports across batches', included: true },
      { text: 'Recruiter-facing batch exports & analytics', included: true },
      { text: 'Dedicated institutional onboarding & account manager', included: true },
    ],
  },
};
