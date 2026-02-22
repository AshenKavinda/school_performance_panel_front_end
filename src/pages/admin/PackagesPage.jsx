/**
 * PackagesPage — CRUD for subscription packages.
 * ⚠️  The API uses misspelled field names: `labal` (label) and `discription` (description).
 *      We display human-friendly labels in the UI but send the exact API field names.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  getPackages, createPackage, updatePackage, deletePackage,
} from '../../services/managementService';
import { useToast }     from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

const EMPTY_FORM = { labal: '', discription: '', periodInMonths: '', price: '' };

// ── Shared form fields — defined at MODULE LEVEL so React doesn't remount on each render ──
const PackageFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput
      label="Package Name" name="labal" required
      value={form.labal}
      onChange={onChange}
      error={errors.labal}
      hint="Displayed to school admins"
    />
    <FormInput
      label="Description" name="discription" type="textarea" rows={2} required
      value={form.discription}
      onChange={onChange}
      error={errors.discription}
    />
    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Period (months)" name="periodInMonths" type="number" required
        value={form.periodInMonths}
        onChange={onChange}
        error={errors.periodInMonths}
        hint="e.g. 12 for annual"
      />
      <FormInput
        label="Price ($)" name="price" type="number" required
        value={form.price}
        onChange={onChange}
        error={errors.price}
        hint="e.g. 99.99"
      />
    </div>
  </div>
);

// ── Validation ────────────────────────────────────────────────────────────────
const validateForm = (f) => {
  const errs = {};
  if (!f.labal.trim())       errs.labal        = 'Package name is required';
  if (!f.discription.trim()) errs.discription  = 'Description is required';
  const period = Number(f.periodInMonths);
  if (!f.periodInMonths || isNaN(period) || period < 1) errs.periodInMonths = 'Enter a valid period (≥ 1 month)';
  const price = Number(f.price);
  if (!f.price || isNaN(price) || price < 0) errs.price = 'Enter a valid price';
  return errs;
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'labal',
    header: 'Package Name',
    render: (r) => <span className="font-semibold text-gray-800">{r.labal ?? '—'}</span>,
  },
  {
    key: 'discription',
    header: 'Description',
    render: (r) => (
      <span className="text-gray-500 truncate max-w-xs block" title={r.discription}>
        {r.discription ?? '—'}
      </span>
    ),
  },
  {
    key: 'periodInMonths',
    header: 'Period',
    render: (r) =>
      r.periodInMonths ? `${r.periodInMonths} month${r.periodInMonths !== 1 ? 's' : ''}` : '—',
  },
  {
    key: 'price',
    header: 'Price',
    render: (r) =>
      r.price != null ? (
        <span className="font-medium text-gray-800">${Number(r.price).toFixed(2)}</span>
      ) : '—',
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    header: '',
    render: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => onEdit(r)}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(r)}
          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const PackagesPage = () => {
  const { success, error: toastError } = useToast();

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createForm, setCreateForm]   = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating]       = useState(false);

  // Edit modal
  const [editTarget, setEditTarget]  = useState(null);
  const [editForm, setEditForm]      = useState(EMPTY_FORM);
  const [editErrors, setEditErrors]  = useState({});
  const [saving, setSaving]          = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getPackages();
      const filtered = Array.isArray(data) ? data.filter(p => !p.isDeleted) : [];
      setRows(filtered);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Field helper ──────────────────────────────────────────────────────────
  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  // ── Create handlers ───────────────────────────────────────────────────────
  const openCreate = () => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateForm(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createPackage({
        labal:          createForm.labal,
        discription:    createForm.discription,
        periodInMonths: Number(createForm.periodInMonths),
        price:          Number(createForm.price),
      });
      success('Package created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      labal:          row.labal         ?? '',
      discription:    row.discription   ?? '',
      periodInMonths: String(row.periodInMonths ?? ''),
      price:          String(row.price          ?? ''),
    });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updatePackage(editTarget.id, {
        labal:          editForm.labal,
        discription:    editForm.discription,
        periodInMonths: Number(editForm.periodInMonths),
        price:          Number(editForm.price),
      });
      success('Package updated successfully');
      closeEdit();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePackage(deleteTarget.id);
      success('Package deleted');
      setDeleteTarget(null);
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget);

  return (
    <div>
      <PageHeader
        title="Subscription Packages"
        subtitle="Create and manage plans available to school administrators."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Package
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        error={fetchErr}
        emptyMessage="No packages found. Create one to get started."
        onRetry={fetchList}
      />

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create Package"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Package'}
            </button>
          </div>
        }
      >
        <PackageFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit — ${editTarget?.labal ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <PackageFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete Package"
        confirmLabel="Delete"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete the package <strong>{deleteTarget?.labal}</strong>?
          Schools currently subscribed to this plan may be affected.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default PackagesPage;
