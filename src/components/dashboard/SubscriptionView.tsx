import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Users,
  Clock,
  QrCode,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR, getSubscriptionPlanInfo } from '../../utils/formatters';
import { PRICING_PLANS } from '../../constants/pricing';
import { useStudentTwin } from '../../contexts/StudentTwinContext';
import { UpiPaymentModal } from './UpiPaymentModal';

interface SubscriptionViewProps {
  userProfile: UserProfile | null;
  isDemo?: boolean;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  userProfile,
  isDemo = false,
}) => {
  const { updateUserProfile, upgradeSubscription } = useStudentTwin();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [isActivatingPlan, setIsActivatingPlan] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Campus Form State
  const [campusForm, setCampusForm] = useState({
    name: userProfile?.fullName || '',
    university: userProfile?.university || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    cohortSize: '200 - 500 Students',
    requirements: '',
  });

  const [campusErrors, setCampusErrors] = useState<Record<string, string>>({});
  const [isSubmittingCampus, setIsSubmittingCampus] = useState(false);
  const [campusSubmitted, setCampusSubmitted] = useState(false);

  const freePlan = PRICING_PLANS.free;
  const proPlan = PRICING_PLANS.pro;
  const institutionalPlan = PRICING_PLANS.institutional;

  const planInfo = getSubscriptionPlanInfo(userProfile, isDemo);
  const isPro = planInfo.isPro;
  const isPendingVerification = planInfo.isPending;
  const isMonthlyPro = planInfo.isMonthly;

  const currentPlanLabel = () => planInfo.fullLabel;

  const handleConfirmUpiPayment = async (transactionRef?: string) => {
    setIsActivatingPlan(true);
    try {
      const targetPlan = billingCycle === 'monthly' ? 'pro_monthly' : 'pro_annual';
      const res = await upgradeSubscription(targetPlan, billingCycle, transactionRef);
      if (res.error) {
        throw res.error;
      }
      const planName = billingCycle === 'monthly' ? 'Student Pro Monthly — ACTIVE' : 'Student Pro Annual — ACTIVE';
      const amount = billingCycle === 'monthly' ? 499 : 1499;
      setActionSuccessMessage(
        `Payment Successful! ${planName} (${formatINR(amount)} paid via UPI to 8520981574@ybl). Your Pro Digital Twin features are now fully active.`
      );
      setIsUpiModalOpen(false);
    } catch (err: any) {
      console.error('UPI upgrade error:', err);
      throw err;
    } finally {
      setIsActivatingPlan(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setIsActivatingPlan(true);
    try {
      if (updateUserProfile && !isDemo) {
        await updateUserProfile({
          plan: 'free',
          billingCycle: undefined,
          subscriptionStatus: 'active',
        });
      }
      setActionSuccessMessage('Your plan has been switched to the Free Plan (₹0).');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsActivatingPlan(false);
    }
  };

  const validateCampusForm = () => {
    const errors: Record<string, string> = {};
    if (!campusForm.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!campusForm.university.trim()) {
      errors.university = 'Institution / University name is required.';
    }
    if (!campusForm.email.trim()) {
      errors.email = 'University email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campusForm.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!campusForm.requirements.trim()) {
      errors.requirements = 'Please describe your department or placement cell requirements.';
    } else if (campusForm.requirements.trim().length < 10) {
      errors.requirements = 'Requirements must be at least 10 characters.';
    }

    setCampusErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCampusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCampusForm()) return;

    setIsSubmittingCampus(true);
    setTimeout(() => {
      setIsSubmittingCampus(false);
      setCampusSubmitted(true);
    }, 600);
  };

  const handleResetCampusForm = () => {
    setCampusSubmitted(false);
    setCampusForm({
      name: userProfile?.fullName || '',
      university: userProfile?.university || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      cohortSize: '200 - 500 Students',
      requirements: '',
    });
    setCampusErrors({});
    setIsCampusModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Subscription & Billing
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Indian Rupee (₹) pricing with transparent UPI payments for student and institutional tiers.
          </p>
        </div>

        <Badge
          variant={isPendingVerification ? 'amber' : isPro ? 'blue' : 'slate'}
          size="md"
        >
          {currentPlanLabel()}
        </Badge>
      </div>

      {/* Notifications / Alerts */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-900 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Verification Notice Banner */}
      {isPendingVerification && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">
                Payment Submitted — Verification Pending
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Your UPI transaction (paid to <strong>8520981574@ybl</strong>) is recorded and awaiting verification. You can continue utilizing your Student Twin features.
              </p>
              {userProfile?.subscriptionDetails?.transactionRef && (
                <p className="text-[10px] font-mono text-amber-400 mt-1">
                  Reference / UTR: {userProfile.subscriptionDetails.transactionRef}
                </p>
              )}
            </div>
          </div>
          <Button
            id="sub-pending-support-btn"
            variant="outline"
            size="sm"
            onClick={() => setIsUpiModalOpen(true)}
            className="text-xs shrink-0"
          >
            View UPI Details
          </Button>
        </div>
      )}

      {/* Current Active Plan Status Card */}
      <Card className="p-6 border-slate-800 dark:border-slate-800 light:border-sky-200" glow>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                isPendingVerification
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : isPro
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isPendingVerification ? (
                <Clock className="w-6 h-6" />
              ) : isPro ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <CreditCard className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {isPendingVerification
                    ? 'Student Pro (Pending Verification)'
                    : isMonthlyPro
                    ? 'Student Pro Monthly — ACTIVE'
                    : isPro
                    ? 'Student Pro Annual — ACTIVE'
                    : 'Free Plan (Active)'}
                </h3>
                <Badge
                  variant={isPendingVerification ? 'amber' : isPro ? 'blue' : 'emerald'}
                  size="sm"
                >
                  {isPendingVerification
                    ? 'Verification Pending'
                    : isPro
                    ? 'Pro Twin Active'
                    : 'Default Free Plan'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mt-0.5">
                {isPro || isPendingVerification
                  ? `Full AI Career OS intelligence, benchmark simulation, and syllabus analyzer enabled.`
                  : `Default free tier with full digital twin records and baseline readiness scoring.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="text-left sm:text-right">
              <span className="text-2xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                {userProfile?.plan === 'pro_monthly' || (userProfile?.plan === 'pro' && userProfile?.billingCycle === 'monthly')
                  ? formatINR(499)
                  : isPro || isPendingVerification
                  ? formatINR(1499)
                  : formatINR(0)}
              </span>
              <span className="text-xs text-slate-400 block">
                {userProfile?.plan === 'pro_monthly' || (userProfile?.plan === 'pro' && userProfile?.billingCycle === 'monthly')
                  ? '/ month'
                  : isPro || isPendingVerification
                  ? '/ year'
                  : '/ forever'}
              </span>
            </div>

            {(isPro || isPendingVerification) && !isDemo && (
              <Button
                id="sub-downgrade-btn"
                variant="outline"
                size="sm"
                onClick={handleDowngradeToFree}
                isLoading={isActivatingPlan}
                className="text-xs"
              >
                Switch to Free Plan
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Plan Cards & Upgrade Comparison */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
            Available Plans & Upgrades
          </h3>

          {/* Billing Cycle Switch */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-sky-100 border border-slate-800 dark:border-slate-800 light:border-sky-200 text-xs">
            <button
              id="sub-billing-monthly-btn"
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              id="sub-billing-annual-btn"
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Save {proPlan.annualDiscountPercent}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE PLAN */}
          <Card
            className={`p-6 flex flex-col justify-between ${
              !isPro && !isPendingVerification
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-800'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {freePlan.name}
                </h4>
                <Badge variant={freePlan.badgeVariant} size="sm">
                  {!isPro && !isPendingVerification ? 'Active Plan' : freePlan.badge}
                </Badge>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                  {formatINR(0)}
                </span>
                <span className="text-xs text-slate-400"> / forever</span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Default starter tier for all students
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mb-6">
                {freePlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              id="sub-free-plan-btn"
              variant="outline"
              size="sm"
              disabled={!isPro && !isPendingVerification}
              onClick={handleDowngradeToFree}
              className="w-full"
            >
              {!isPro && !isPendingVerification ? 'Current Plan' : 'Downgrade to Free'}
            </Button>
          </Card>

          {/* STUDENT PRO */}
          <Card
            className={`p-6 flex flex-col justify-between relative ${
              isPro || isPendingVerification
                ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-blue-500/5'
                : 'border-blue-500/50 shadow-md shadow-blue-500/10'
            }`}
            glow
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {proPlan.name}
                </h4>
                <Badge variant="blue" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isPendingVerification
                    ? 'Pending Verification'
                    : isPro
                    ? 'Active Plan'
                    : proPlan.badge}
                </Badge>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                  {billingCycle === 'annual' ? formatINR(1499) : formatINR(499)}
                </span>
                <span className="text-xs text-slate-400">
                  {billingCycle === 'annual' ? ' / year' : ' / month'}
                </span>
                <span className="text-xs text-emerald-400 block mt-0.5 font-medium">
                  {billingCycle === 'annual' ? 'Save ₹4,489 (75% discount vs monthly)' : 'Billed ₹499 monthly'}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mb-6">
                {proPlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span
                      className={
                        f.isProOnly
                          ? 'font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900'
                          : ''
                      }
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              id="sub-pro-plan-btn"
              variant={isPro ? 'outline' : 'gradient'}
              size="sm"
              onClick={() => setIsUpiModalOpen(true)}
              leftIcon={<QrCode className="w-4 h-4" />}
              className="w-full"
            >
              {isPendingVerification
                ? 'View / Update UPI Payment'
                : isPro
                ? 'Active Pro Plan (Renew via UPI)'
                : `Pay ${formatINR(billingCycle === 'annual' ? 1499 : 499)} via UPI`}
            </Button>
          </Card>

          {/* CAMPUS / INSTITUTIONAL */}
          <Card className="p-6 flex flex-col justify-between border-purple-500/30">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  {institutionalPlan.name}
                </h4>
                <Badge variant={institutionalPlan.badgeVariant} size="sm">
                  {institutionalPlan.badge}
                </Badge>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono">
                  Contact Us
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Custom institutional and cohort pricing
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 mb-6">
                {institutionalPlan.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              id="sub-campus-plan-btn"
              variant="secondary"
              size="sm"
              onClick={() => setIsCampusModalOpen(true)}
              leftIcon={<Building2 className="w-4 h-4" />}
              className="w-full"
            >
              {institutionalPlan.ctaLabel}
            </Button>
          </Card>
        </div>
      </div>

      {/* REAL UPI PAYMENT MODAL */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        billingCycle={billingCycle}
        onConfirmPayment={handleConfirmUpiPayment}
        isProcessing={isActivatingPlan}
      />

      {/* CAMPUS / INSTITUTIONAL CONTACT MODAL */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                    Campus & Institutional Partnership
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cohort and department licensing (Custom Institutional Pricing)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetCampusForm}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {campusSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                  Institutional Inquiry Received
                </h4>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                  <p><strong className="text-white">Institution:</strong> {campusForm.university}</p>
                  <p><strong className="text-white">Contact:</strong> {campusForm.name} ({campusForm.email})</p>
                  <p><strong className="text-white">Cohort Size:</strong> {campusForm.cohortSize}</p>
                  <p><strong className="text-white">Requirements:</strong> {campusForm.requirements}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our academic partnership team will reach out at <strong>{campusForm.email}</strong> within 24 business hours to set up your university cohort pilot.
                </p>
                <Button
                  id="campus-done-btn"
                  variant="primary"
                  size="sm"
                  onClick={handleResetCampusForm}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCampusSubmit} className="space-y-4" noValidate>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Coordinator / Department Head Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={campusForm.name}
                    onChange={(e) => {
                      setCampusForm({ ...campusForm, name: e.target.value });
                      if (campusErrors.name) setCampusErrors({ ...campusErrors, name: '' });
                    }}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  {campusErrors.name && (
                    <p className="mt-1 text-[11px] text-rose-400">{campusErrors.name}</p>
                  )}
                </div>

                {/* Institution Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    College / University / Organization <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={campusForm.university}
                    onChange={(e) => {
                      setCampusForm({ ...campusForm, university: e.target.value });
                      if (campusErrors.university) setCampusErrors({ ...campusErrors, university: '' });
                    }}
                    placeholder="e.g. National Institute of Engineering"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  {campusErrors.university && (
                    <p className="mt-1 text-[11px] text-rose-400">{campusErrors.university}</p>
                  )}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={campusForm.email}
                      onChange={(e) => {
                        setCampusForm({ ...campusForm, email: e.target.value });
                        if (campusErrors.email) setCampusErrors({ ...campusErrors, email: '' });
                      }}
                      placeholder="ramesh@university.edu.in"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    {campusErrors.email && (
                      <p className="mt-1 text-[11px] text-rose-400">{campusErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={campusForm.phone}
                      onChange={(e) => setCampusForm({ ...campusForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* Cohort Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Expected Number of Students / Users
                  </label>
                  <select
                    value={campusForm.cohortSize}
                    onChange={(e) => setCampusForm({ ...campusForm, cohortSize: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="50 - 200 Students">50 - 200 Students (Single Department)</option>
                    <option value="200 - 500 Students">200 - 500 Students (Department Cohort)</option>
                    <option value="500 - 2000 Students">500 - 2,000 Students (Multi-Department)</option>
                    <option value="2000+ Students">2,000+ Students (Institution-Wide Campus License)</option>
                  </select>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1">
                    Requirements & Placement Cell Objectives <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={campusForm.requirements}
                    onChange={(e) => {
                      setCampusForm({ ...campusForm, requirements: e.target.value });
                      if (campusErrors.requirements) setCampusErrors({ ...campusErrors, requirements: '' });
                    }}
                    placeholder="e.g. Ingest 4th year CSE syllabus, track DSA readiness, and export batch metrics for visiting recruiters..."
                    className="w-full p-3 rounded-xl text-xs bg-slate-950/60 dark:bg-slate-950/60 light:bg-sky-50 border border-slate-800 dark:border-slate-800 light:border-sky-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y"
                  />
                  {campusErrors.requirements && (
                    <p className="mt-1 text-[11px] text-rose-400">{campusErrors.requirements}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    id="campus-cancel-btn"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetCampusForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="campus-submit-btn"
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingCampus}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Campus Inquiry
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
