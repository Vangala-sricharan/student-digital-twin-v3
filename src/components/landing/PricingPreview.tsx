import React, { useState } from 'react';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/formatters';
import { PRICING_PLANS } from '../../constants/pricing';

interface PricingPreviewProps {
  onSelectPlan: (plan: string) => void;
  onTryDemo: () => void;
  onContactInstitutional?: () => void;
}

export const PricingPreview: React.FC<PricingPreviewProps> = ({
  onSelectPlan,
  onTryDemo,
  onContactInstitutional,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const freePlan = PRICING_PLANS.free;
  const proPlan = PRICING_PLANS.pro;
  const institutionalPlan = PRICING_PLANS.institutional;

  const handleCampusClick = () => {
    if (onContactInstitutional) {
      onContactInstitutional();
    } else {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        onSelectPlan('institutional');
      }
    }
  };

  return (
    <section id="pricing" className="py-20 border-t border-slate-800/80 dark:border-slate-800/80 light:border-sky-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="purple" size="md" className="mb-4">
            Transparent INR Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            Plans for Every Stage of Your Career
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 dark:text-slate-300 light:text-slate-600">
            Start completely free with zero credit card required. Upgrade when you are ready to accelerate your engineering career.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-sky-100 border border-slate-800 dark:border-slate-800 light:border-sky-200">
            <button
              id="pricing-billing-monthly-btn"
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700 light:hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              id="pricing-billing-annual-btn"
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:text-slate-700 light:hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Save {proPlan.annualDiscountPercent}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* FREE PLAN */}
          <Card className="p-8 flex flex-col justify-between relative border-slate-800 dark:border-slate-800 light:border-sky-200">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {freePlan.name}
                </h3>
                <Badge variant={freePlan.badgeVariant} size="sm">{freePlan.badge}</Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6">
                {freePlan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                    {formatINR(freePlan.monthlyPrice)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">/ forever</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default plan for every new account</p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 pb-8">
                {freePlan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              id="pricing-free-btn"
              variant="outline"
              size="md"
              onClick={() => onSelectPlan('free')}
              className="w-full"
            >
              {freePlan.ctaLabel}
            </Button>
          </Card>

          {/* STUDENT PRO */}
          <Card
            className="p-8 flex flex-col justify-between relative border-blue-500/50 shadow-xl shadow-blue-500/10 bg-slate-900 dark:bg-slate-900 light:bg-sky-50/80"
            glow
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-3.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md uppercase tracking-wider">
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {proPlan.name}
                </h3>
                <Badge variant={proPlan.badgeVariant} size="sm">
                  <Sparkles className="w-3 h-3 mr-1" /> {proPlan.badge}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6">
                {proPlan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                    {billingCycle === 'annual' ? formatINR(proPlan.annualPrice) : formatINR(proPlan.monthlyPrice)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                    {billingCycle === 'annual' ? '/ year' : '/ month'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                  {billingCycle === 'annual' ? `Billed annually (${proPlan.annualDiscountText})` : 'Billed monthly'}
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 pb-8">
                {proPlan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className={f.isProOnly ? 'font-medium' : 'font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900'}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              id="pricing-pro-btn"
              variant="gradient"
              size="md"
              onClick={() => onSelectPlan('pro')}
              rightIcon={<Zap className="w-4 h-4" />}
              className="w-full shadow-md"
            >
              {proPlan.ctaLabel}
            </Button>
          </Card>

          {/* CAMPUS / INSTITUTIONAL */}
          <Card className="p-8 flex flex-col justify-between relative border-slate-800 dark:border-slate-800 light:border-sky-200">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {institutionalPlan.name}
                </h3>
                <Badge variant={institutionalPlan.badgeVariant} size="sm">{institutionalPlan.badge}</Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-6">
                {institutionalPlan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                    {formatINR(institutionalPlan.annualPrice)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">/ cohort / year</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Multi-student department & campus licensing</p>
              </div>

              <div className="space-y-3 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 pb-8">
                {institutionalPlan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              id="pricing-institutional-btn"
              variant="secondary"
              size="md"
              onClick={handleCampusClick}
              leftIcon={<Building2 className="w-4 h-4" />}
              className="w-full"
            >
              {institutionalPlan.ctaLabel}
            </Button>
          </Card>
        </div>

        {/* Demo trigger banner */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
            Want to explore all digital twin features first?{' '}
            <button
              id="pricing-try-demo-btn"
              type="button"
              onClick={onTryDemo}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Explore Creator Demo Mode
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};
