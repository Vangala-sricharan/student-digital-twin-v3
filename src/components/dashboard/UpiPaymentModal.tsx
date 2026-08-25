import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  Smartphone,
  Info,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/formatters';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingCycle: 'monthly' | 'annual';
  onConfirmPayment: (transactionRef?: string) => Promise<void>;
  isProcessing: boolean;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  billingCycle,
  onConfirmPayment,
  isProcessing,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const upiId = '8520981574@ybl';
  const payeeName = 'Student Digital Twin';
  const amount = billingCycle === 'monthly' ? 499 : 1499;
  const planTitle = billingCycle === 'monthly' ? 'Student Pro Monthly' : 'Student Pro Annual';
  const transactionNote = `Student Pro ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`;

  // UPI deep link
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(upiUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, upiUrl]);

  if (!isOpen) return null;

  const handleCopyUpiId = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = upiId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy UPI ID:', e);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    try {
      await onConfirmPayment(transactionRef.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0a0a0c] dark:bg-[#0a0a0c] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 light:text-slate-900">
                Pay via UPI ({formatINR(amount)})
              </h3>
              <p className="text-xs text-slate-400">
                {planTitle} • {billingCycle === 'monthly' ? '₹499 / month' : '₹1,499 / year'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close UPI Payment Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* QR Code & Direct Link */}
        <div className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="UPI QR Code"
                className="w-36 h-36 object-contain rounded"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-2.5 text-center sm:text-left flex-1 w-full">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Official UPI ID
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <code className="px-2.5 py-1 rounded bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 font-mono text-xs font-bold text-blue-400">
                  {upiId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Payable Amount
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatINR(amount)}
              </span>
            </div>

            {/* Mobile UPI deep link */}
            <a
              id="upi-direct-pay-link"
              href={upiUrl}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Pay {formatINR(amount)} via UPI App
            </a>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-1.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 bg-white/5 dark:bg-white/5 light:bg-sky-50/60 p-3.5 rounded-xl border border-white/10 dark:border-white/10 light:border-sky-200">
          <p className="font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Payment Instructions:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 dark:text-slate-400 light:text-slate-600 text-[11px] leading-relaxed">
            <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM, Cred, Amazon Pay).</li>
            <li>Scan the QR code above or send {formatINR(amount)} directly to <strong className="text-slate-200">{upiId}</strong>.</li>
            <li>Enter your 12-digit UPI UTR / Reference Number below (optional but helps fast-track verification).</li>
            <li>Click <strong>"I Have Paid"</strong> to register your upgrade request.</li>
          </ol>
        </div>

        {/* UTR / Transaction Reference Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 mb-1">
            UPI UTR / Transaction Reference ID <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            id="upi-utr-input"
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. 412356789012 (12-digit UTR)"
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <Button
            id="upi-modal-cancel-btn"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            id="upi-modal-confirm-btn"
            variant="gradient"
            size="sm"
            onClick={handleSubmit}
            isLoading={isProcessing}
            rightIcon={<Check className="w-4 h-4" />}
          >
            I Have Paid
          </Button>
        </div>
      </div>
    </div>
  );
};
