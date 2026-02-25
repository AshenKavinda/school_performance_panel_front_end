import { useCallback, useEffect, useState } from 'react';
import {
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
} from '../../services/managementService';
import { useToast }     from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

const EMPTY_CREATE = {
  username: '', email: '', password: '', nic: '', employeeNumber: '',
};
const EMPTY_EDIT = { nic: '', employeeNumber: '' };

// ── Validation ────────────────────────────────────────────────────────────────
const validateCreate = (f) => {
  const errs = {};
  if (!f.username.trim())  errs.username = 'Username is required';
  if (!f.email.trim())     errs.email    = 'Email is required';
  if (!/\S+@\S+\.\S+/.test(f.email)) errs.email = 'Enter a valid email';
  if (!f.password.trim()) errs.password = 'Password is required';
  if (f.password.length < 6) errs.password = 'Minimum 6 characters';
  return errs;
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'username',
    header: 'Username',
    render: (r) => <span className="font-medium text-gray-800 dark:text-gray-200">{r.username ?? '—'}</span>,
  },
  { key: 'email',          header: 'Email',        render: (r) => r.email          ?? '—' },
  { key: 'nic',            header: 'NIC',           render: (r) => r.nic            ?? <span className="text-gray-300 dark:text-gray-600">—</span> },
  { key: 'employeeNumber', header: 'Employee #',    render: (r) => r.employeeNumber ?? <span className="text-gray-300 dark:text-gray-600">—</span> },
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
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(r)}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition"
        >
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const AdminAccountsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search, setSearch]     = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget]  = useState(null);
  const [editForm, setEditForm]      = useState(EMPTY_EDIT);
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
      const data = await getAdmins();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.username       ?? '').toLowerCase().includes(q) ||
      (r.email          ?? '').toLowerCase().includes(q) ||
      (r.employeeNumber ?? '').toLowerCase().includes(q)
    );
  });

  // ── Create handlers ───────────────────────────────────────────────────────
  const openCreate = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }

    setCreating(true);
    try {
      await createAdmin({
        username:       createForm.username,
        email:          createForm.email,
        password:       createForm.password,
        nic:            createForm.nic    || null,
        employeeNumber: createForm.employeeNumber || null,
      });
      success('Admin account created successfully');
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
    setEditForm({ nic: row.nic ?? '', employeeNumber: row.employeeNumber ?? '' });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdmin(editTarget.id, {
        nic:            editForm.nic            || null,
        employeeNumber: editForm.employeeNumber || null,
      });
      success('Admin account updated');
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
      await deleteAdmin(deleteTarget.id);
      success('Admin account deleted');
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
        title="Admin Accounts"
        subtitle="Manage platform administrator accounts."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Admin
          </button>
        }
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, email or employee #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={fetchErr}
        emptyMessage="No admin accounts found."
        onRetry={fetchList}
      />

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create Admin Account"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={closeCreate}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {creating ? 'Creating…' : 'Create Admin'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="Username" name="username" required
            value={createForm.username}
            onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
            error={createErrors.username}
          />
          <FormInput
            label="Email" name="email" type="email" required
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            error={createErrors.email}
          />
          <FormInput
            label="Password" name="password" type="password" required
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            error={createErrors.password}
          />
          <FormInput
            label="NIC" name="nic"
            value={createForm.nic}
            onChange={(e) => setCreateForm((f) => ({ ...f, nic: e.target.value }))}
            hint="Optional"
          />
          <FormInput
            label="Employee Number" name="employeeNumber"
            value={createForm.employeeNumber}
            onChange={(e) => setCreateForm((f) => ({ ...f, employeeNumber: e.target.value }))}
            hint="Optional"
          />
        </div>
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit — ${editTarget?.username ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormInput
            label="NIC" name="nic"
            value={editForm.nic}
            onChange={(e) => setEditForm((f) => ({ ...f, nic: e.target.value }))}
            error={editErrors.nic}
          />
          <FormInput
            label="Employee Number" name="employeeNumber"
            value={editForm.employeeNumber}
            onChange={(e) => setEditForm((f) => ({ ...f, employeeNumber: e.target.value }))}
            error={editErrors.employeeNumber}
          />
        </div>
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete Admin Account"
        confirmLabel="Delete"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default AdminAccountsPage;
