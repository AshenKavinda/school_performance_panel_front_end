import { useCallback, useEffect, useState } from 'react';
import {
  getApplicationAdmins,
  updateApplicationAdmin,
  enableApplicationAdmin,
  disableApplicationAdmin,
} from '../../services/managementService';
import { useToast }    from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader, Badge,
} from '../../components/common';

const APPLICATION_TYPE_OPTIONS = [
  { value: 'SUBJECT_BASE', label: 'Subject Base' },
  { value: 'MODULE_BASE',  label: 'Module Base' },
  { value: 'BOTH',         label: 'Both' },
];

const EMPTY_EDIT = { nic: '', applicationType: 'SUBJECT_BASE' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onView, onEdit, onToggle) => [
  {
    key: 'username',
    header: 'Username',
    render: (r) => <span className="font-medium text-gray-800">{r.username ?? '—'}</span>,
  },
  { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
  {
    key: 'nic',
    header: 'NIC',
    render: (r) => r.nic ?? <span className="text-gray-300">—</span>,
  },
  {
    key: 'applicationType',
    header: 'Type',
    render: (r) => {
      const map = {
        SUBJECT_BASE: 'info',
        MODULE_BASE:  'purple',
        BOTH:         'teal',
      };
      return r.applicationType
        ? <Badge variant={map[r.applicationType] ?? 'default'}>{r.applicationType}</Badge>
        : <span className="text-gray-300">—</span>;
    },
  },
  {
    key: 'isActive',
    header: 'Status',
    render: (r) => (
      <Badge variant={r.isActive ? 'success' : 'error'}>
        {r.isActive ? 'Active' : 'Disabled'}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Registered',
    render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    header: '',
    render: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => onView(r)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
        >
          View
        </button>
        <button
          onClick={() => onEdit(r)}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(r)}
          className={`text-xs font-medium px-2 py-1 rounded transition ${
            r.isActive
              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
          }`}
        >
          {r.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const ApplicationAdminsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search, setSearch]   = useState('');

  // View detail modal
  const [viewTarget, setViewTarget] = useState(null);

  // Edit modal
  const [editTarget, setEditTarget]  = useState(null);
  const [form, setForm]              = useState(EMPTY_EDIT);
  const [formErrors, setFormErrors]  = useState({});
  const [saving, setSaving]          = useState(false);

  // Enable/Disable confirm
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling]         = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getApplicationAdmins();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.username ?? '').toLowerCase().includes(q) ||
      (r.email    ?? '').toLowerCase().includes(q) ||
      (r.nic      ?? '').toLowerCase().includes(q)
    );
  });

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({ nic: row.nic ?? '', applicationType: row.applicationType ?? 'SUBJECT_BASE' });
    setFormErrors({});
  };
  const closeEdit = () => { setEditTarget(null); setForm(EMPTY_EDIT); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateApplicationAdmin(editTarget.id, {
        nic: form.nic || null,
        applicationType: form.applicationType,
      });
      success('School admin updated successfully');
      closeEdit();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle handlers ───────────────────────────────────────────────────────
  const openToggle = (row) => setToggleTarget(row);
  const closeToggle = () => setToggleTarget(null);

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (toggleTarget.isActive) {
        await disableApplicationAdmin(toggleTarget.id);
        success(`${toggleTarget.username} has been disabled`);
      } else {
        await enableApplicationAdmin(toggleTarget.id);
        success(`${toggleTarget.username} has been enabled`);
      }
      closeToggle();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setToggling(false);
    }
  };

  const columns = buildColumns(setViewTarget, openEdit, openToggle);

  return (
    <div>
      <PageHeader
        title="School Accounts"
        subtitle="Manage all Application Admin (school) accounts on the platform."
      />

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, email or NIC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={fetchErr}
        emptyMessage="No school accounts found."
        onRetry={fetchList}
      />

      {/* ── View detail modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="School Account Details"
        size="md"
      >
        {viewTarget && (
          <div className="space-y-3 text-sm">
            {[
              ['Username',        viewTarget.username],
              ['Email',           viewTarget.email],
              ['NIC',             viewTarget.nic ?? '—'],
              ['Application Type',viewTarget.applicationType ?? '—'],
              ['Status',          viewTarget.isActive ? 'Active' : 'Disabled'],
              ['Registered',      viewTarget.createdAt ? new Date(viewTarget.createdAt).toLocaleString() : '—'],
              ['Last Updated',    viewTarget.updatedAt ? new Date(viewTarget.updatedAt).toLocaleString() : '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex gap-4">
                <span className="text-gray-400 w-36 flex-shrink-0">{label}</span>
                <span className="text-gray-800 font-medium break-all">{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit — ${editTarget?.username ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={closeEdit}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="NIC"
            name="nic"
            value={form.nic}
            onChange={(e) => setForm((f) => ({ ...f, nic: e.target.value }))}
            error={formErrors.nic}
            hint="National Identity Card number"
          />
          <FormInput
            label="Application Type"
            name="applicationType"
            type="select"
            value={form.applicationType}
            onChange={(e) => setForm((f) => ({ ...f, applicationType: e.target.value }))}
            options={APPLICATION_TYPE_OPTIONS}
            error={formErrors.applicationType}
          />
        </div>
      </Modal>

      {/* ── Toggle confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={closeToggle}
        onConfirm={handleToggle}
        loading={toggling}
        variant={toggleTarget?.isActive ? 'danger' : 'info'}
        title={toggleTarget?.isActive ? 'Disable School Account' : 'Enable School Account'}
        confirmLabel={toggleTarget?.isActive ? 'Disable' : 'Enable'}
      >
        <p className="text-sm text-gray-600">
          {toggleTarget?.isActive
            ? `Disabling <strong>${toggleTarget?.username}</strong> will prevent them from accessing the platform.`
            : `Enabling <strong>${toggleTarget?.username}</strong> will restore their platform access.`}
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default ApplicationAdminsPage;
