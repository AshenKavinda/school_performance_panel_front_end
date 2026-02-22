import { useCallback, useEffect, useState } from 'react';
import { getMySubscription, checkMySubscription } from '../../services/paymentService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── Detail row ────────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, highlight }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-100 last:border-0">
    <dt className="sm:w-44 text-sm font-medium text-gray-500 flex-shrink-0">{label}</dt>
    <dd className={`text-sm font-semibold ${highlight ? 'text-purple-700' : 'text-gray-800'}`}>
      {value ?? '—'}
    </dd>
  </div>
);

const SubscriptionPage = () => {
  const { error: toastError } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [isActive,     setIsActive]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [fetchErr,     setFetchErr]     = useState(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const [subData, activeFlag] = await Promise.all([
        getMySubscription(),
        checkMySubscription(),
      ]);
      setSubscription(subData);
      setIsActive(activeFlag === true || activeFlag?.value === true);
    } catch (e) {
      const msg = parseApiError(e);
      setFetchErr(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const daysLeft   = subscription?.daysRemaining ?? null;
  const expiryDate = subscription?.expiryDate
    ? new Date(subscription.expiryDate).toLocaleDateString()
    : null;
  const payment    = subscription?.activePayment;

  // Determine urgency colour for days remaining
  const daysColor =
    daysLeft == null  ? 'text-gray-500'
    : daysLeft <= 7   ? 'text-red-600 font-bold'
    : daysLeft <= 14  ? 'text-orange-600 font-semibold'
    : 'text-green-600 font-semibold';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        subtitle="Details about your school's current plan and payment history."
        action={
          <button
            onClick={fetchSubscription}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        }
      />

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && fetchErr && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{fetchErr}</span>
        </div>
      )}

      {!loading && !fetchErr && (
        <>
          {/* ── Status banner ──────────────────────────────────────────────── */}
          <div className={`flex items-center gap-4 p-5 rounded-xl border ${
            isActive
              ? daysLeft != null && daysLeft <= 14
                ? 'bg-orange-50 border-orange-200 text-orange-800'
                : 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isActive
                ? daysLeft != null && daysLeft <= 14 ? 'bg-orange-200' : 'bg-green-200'
                : 'bg-red-200'
            }`}>
              {isActive ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-bold text-lg">
                {isActive ? 'Subscription Active' : 'No Active Subscription'}
              </p>
              <p className="text-sm opacity-80 mt-0.5">
                {isActive
                  ? daysLeft != null
                    ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining${expiryDate ? ` · Expires ${expiryDate}` : ''}`
                    : subscription?.message ?? 'Your subscription is active.'
                  : subscription?.message ?? 'Contact your platform administrator to activate a plan.'}
              </p>
            </div>
          </div>

          {/* ── Package info ───────────────────────────────────────────────── */}
          {payment && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-purple-50">
                <h2 className="text-sm font-semibold text-purple-800">Current Package</h2>
              </div>
              <dl className="px-5">
                <DetailRow label="Package Name"         value={payment.packageLabal}         highlight />
                <DetailRow label="Description"          value={payment.packageDiscription} />
                <DetailRow label="Period"               value={payment.packagePeriodInMonths != null ? `${payment.packagePeriodInMonths} month${payment.packagePeriodInMonths !== 1 ? 's' : ''}` : null} />
                <DetailRow label="Package Price"        value={payment.packagePrice != null ? `$${Number(payment.packagePrice).toFixed(2)}` : null} />
              </dl>
            </div>
          )}

          {/* ── Payment details ────────────────────────────────────────────── */}
          {payment && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-purple-50">
                <h2 className="text-sm font-semibold text-purple-800">Payment Details</h2>
              </div>
              <dl className="px-5">
                <DetailRow label="Amount Paid"    value={payment.amount != null ? `$${Number(payment.amount).toFixed(2)}` : null} highlight />
                <DetailRow label="Payment Date"   value={payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : null} />
                <DetailRow label="Expiry Date"    value={expiryDate} />
                <DetailRow label="Days Remaining" value={<span className={daysColor}>{daysLeft != null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : '—'}</span>} />
                <DetailRow label="Status"         value={payment.paymentStatus ?? (isActive ? 'ACTIVE' : '—')} />
                <DetailRow label="Payment Method" value={payment.paymentMethod} />
                <DetailRow label="Transaction ID" value={payment.transactionId} />
                <DetailRow label="Currency"       value={payment.currency} />
                {payment.receiptUrl && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-100 last:border-0">
                    <dt className="sm:w-44 text-sm font-medium text-gray-500 flex-shrink-0">Receipt</dt>
                    <dd>
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-800 underline"
                      >
                        View Receipt
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {!subscription?.hasActiveSubscription && !payment && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm">No subscription data available.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubscriptionPage;
