import { useCallback, useEffect, useState } from 'react';
import {
  getPayments, createPayment,
} from '../../services/paymentService';
import { getApplicationAdmins, getPackages } from '../../services/managementService';
import { useToast }     from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader, Badge,
} from '../../components/common';

const EMPTY_CREATE = { applicationAdminId: '', packageId: '' };

// ── Status badge helpers ──────────────────────────────────────────────────────
const ActiveBadge = ({ active }) => (
  <Badge variant={active ? 'success' : 'error'}>{active ? 'Active' : 'Expired'}</Badge>
);

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView) => [
  {
    key: 'applicationAdminUsername',
    header: 'School',
    render: (r) => <span className="font-medium text-gray-800">{r.applicationAdminUsername ?? '—'}</span>,
  },
  {
    key: 'applicationAdminEmail',
    header: 'School Email',
    render: (r) => <span className="text-gray-500">{r.applicationAdminEmail ?? '—'}</span>,
  },
  {
    key: 'packageLabal',
    header: 'Package',
    render: (r) => r.packageLabal ?? '—',
  },
  {
    key: 'amount',
    header: 'Amount',
    render: (r) => <span className="font-semibold text-gray-800">${Number(r.amount ?? 0).toFixed(2)}</span>,
  },
  {
    key: 'paymentDate',
    header: 'Payment Date',
    render: (r) => r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—',
  },
  {
    key: 'expiryDate',
    header: 'Expires',
    render: (r) => r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—',
  },
  {
    key: 'daysRemaining',
    header: 'Days Left',
    render: (r) => {
      if (!r.isActive) return <span className="text-gray-300">—</span>;
      const d = r.daysRemaining ?? 0;
      return (
        <span className={d <= 14 ? 'text-red-600 font-medium' : 'text-gray-700'}>
          {d} day{d !== 1 ? 's' : ''}
        </span>
      );
    },
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (r) => <ActiveBadge active={r.isActive} />,
  },
  {
    key: 'actions',
    header: '',
    render: (r) => (
      <button
        onClick={() => onView(r)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
      >
        Details
      </button>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const PaymentsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows, setRows]         = useState([]);
  const [appAdmins, setAppAdmins] = useState([]);
  const [packages, setPackages]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // Filters
  const [searchSchool, setSearchSchool] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'expired'

  // View detail modal
  const [viewTarget, setViewTarget] = useState(null);

  // Create payment modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating]       = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const [pmts, admins, pkgs] = await Promise.allSettled([
        getPayments(),
        getApplicationAdmins(),
        getPackages(),
      ]);
      setRows(pmts.status  === 'fulfilled' ? (pmts.value  ?? []) : []);
      setAppAdmins(admins.status === 'fulfilled' ? (admins.value ?? []) : []);
      setPackages(pkgs.status   === 'fulfilled' ? (pkgs.value   ?? []) : []);
      if (pmts.status === 'rejected') setFetchErr(parseApiError(pmts.reason));
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const q = searchSchool.toLowerCase();
    const matchSearch =
      (r.applicationAdminUsername ?? '').toLowerCase().includes(q) ||
      (r.applicationAdminEmail    ?? '').toLowerCase().includes(q) ||
      (r.packageLabal             ?? '').toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? r.isActive
        : !r.isActive;
    return matchSearch && matchStatus;
  });

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalRevenue = rows.reduce((s, p) => s + (p.amount ?? 0), 0);
  const activeCount  = rows.filter((p) => p.isActive).length;

  // ── Create handlers ───────────────────────────────────────────────────────
  const openCreate = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = {};
    if (!createForm.applicationAdminId) errs.applicationAdminId = 'Select a school admin';
    if (!createForm.packageId)          errs.packageId          = 'Select a package';
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }

    setCreating(true);
    try {
      await createPayment({
        applicationAdminId: createForm.applicationAdminId,
        packageId:          createForm.packageId,
      });
      success('Payment record created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  const columns = buildColumns(setViewTarget);

  return (
    <div>
      <PageHeader
        title="Payments & Subscriptions"
        subtitle="View all platform payment records and subscription statuses."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Payment
          </button>
        }
      />

      {/* ── Summary pills ── */}
      {!loading && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm shadow-sm">
            <span className="text-gray-500">Total: </span>
            <span className="font-bold text-gray-800">{rows.length}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm shadow-sm">
            <span className="text-gray-500">Active: </span>
            <span className="font-bold text-green-600">{activeCount}</span>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm shadow-sm">
            <span className="text-gray-500">Revenue: </span>
            <span className="font-bold text-blue-600">${totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search school, email or package…"
          value={searchSchool}
          onChange={(e) => setSearchSchool(e.target.value)}
          className="w-full sm:w-72 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { val: 'all',     label: 'All' },
            { val: 'active',  label: 'Active' },
            { val: 'expired', label: 'Expired' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filterStatus === val
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={fetchErr}
        emptyMessage="No payments match the current filters."
        onRetry={fetchList}
      />

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Payment Details"
        size="md"
      >
        {viewTarget && (
          <div className="space-y-3 text-sm">
            {[
              ['School',         viewTarget.applicationAdminUsername],
              ['School Email',   viewTarget.applicationAdminEmail],
              ['Package',        viewTarget.packageLabal],
              ['Package Period', `${viewTarget.packagePeriodInMonths ?? '—'} months`],
              ['Amount',         `$${Number(viewTarget.amount ?? 0).toFixed(2)}`],
              ['Payment Date',   viewTarget.paymentDate       ? new Date(viewTarget.paymentDate).toLocaleString()  : '—'],
              ['Expiry Date',    viewTarget.expiryDate        ? new Date(viewTarget.expiryDate).toLocaleString()   : '—'],
              ['Days Remaining', viewTarget.isActive ? `${viewTarget.daysRemaining ?? 0} days` : 'Expired'],
              ['Status',         viewTarget.isActive ? 'Active' : 'Expired'],
              ['Transaction ID', viewTarget.transactionId ?? '—'],
              ['Payment Method', viewTarget.paymentMethod ?? '—'],
              ['Payment Status', viewTarget.paymentStatus ?? '—'],
              ['Currency',       viewTarget.currency ?? '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex gap-4">
                <span className="text-gray-400 w-36 flex-shrink-0">{label}</span>
                <span className="text-gray-800 font-medium break-all">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Create payment modal ──────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Record New Payment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
              {creating ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="School Admin" name="applicationAdminId" type="select" required
            value={createForm.applicationAdminId}
            onChange={(e) => setCreateForm((f) => ({ ...f, applicationAdminId: e.target.value }))}
            error={createErrors.applicationAdminId}
            options={appAdmins.map((a) => ({ value: a.id, label: a.username ?? a.email ?? a.id }))}
            hint="Select the school this payment is for"
          />
          <FormInput
            label="Package" name="packageId" type="select" required
            value={createForm.packageId}
            onChange={(e) => setCreateForm((f) => ({ ...f, packageId: e.target.value }))}
            error={createErrors.packageId}
            options={packages.map((p) => ({
              value: p.id,
              label: `${p.labal ?? '—'} — $${Number(p.price ?? 0).toFixed(2)} / ${p.periodInMonths}mo`,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PaymentsPage;
