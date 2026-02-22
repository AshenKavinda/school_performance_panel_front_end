import { useCallback, useEffect, useState } from 'react';
import {
  getApplicationAdminByUser,
  getManagersByAppAdmin, createManager, updateManager, deleteManager,
} from '../../services/managementService';
import { useAuth }       from '../../context/AuthContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Validation ────────────────────────────────────────────────────────────────
const validateCreate = (f) => {
  const errs = {};
  if (!f.username.trim())  errs.username = 'Username is required';
  if (!f.email.trim())     errs.email    = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Enter a valid email address';
  if (!f.password.trim())  errs.password = 'Password is required';
  else if (f.password.length < 6)                        errs.password = 'Password must be at least 6 characters';
  return errs;
};

// ── Form field components — MODULE LEVEL to prevent remounting on re-renders ──
const CreateFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Username" name="username" required
      value={form.username} onChange={onChange} error={errors.username}
      placeholder="Enter username"
    />
    <FormInput label="Email" name="email" type="email" required
      value={form.email} onChange={onChange} error={errors.email}
      placeholder="manager@school.com"
    />
    <FormInput label="Password" name="password" type="password" required
      value={form.password} onChange={onChange} error={errors.password}
      placeholder="Min. 6 characters"
    />
    <FormInput label="NIC" name="nic"
      value={form.nic} onChange={onChange} error={errors.nic}
      placeholder="National ID (optional)"
    />
    <FormInput label="Phone Number" name="phoneNumber"
      value={form.phoneNumber} onChange={onChange} error={errors.phoneNumber}
      placeholder="Optional"
    />
  </div>
);

const EditFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="NIC" name="nic"
      value={form.nic} onChange={onChange} error={errors.nic}
      placeholder="National ID"
    />
  </div>
);

// ── Empty form constants ──────────────────────────────────────────────────────
const EMPTY_CREATE = { username: '', email: '', password: '', nic: '', phoneNumber: '' };
const EMPTY_EDIT   = { nic: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'username',
    header: 'Username',
    render: (row) => <span className="font-semibold text-gray-800">{row.username ?? '—'}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => <span className="text-gray-600">{row.email ?? '—'}</span>,
  },
  {
    key: 'nic',
    header: 'NIC',
    render: (row) => row.nic ?? <span className="text-gray-400 italic">—</span>,
  },
  {
    key: 'phoneNumber',
    header: 'Phone',
    render: (row) => row.phoneNumber ?? <span className="text-gray-400 italic">—</span>,
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => onEdit(row)}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(row)}
          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const ManagersPage = () => {
  const { user }                       = useAuth();
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,   setSearch]   = useState('');

  // Create modal
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setFetchErr(null);
    try {
      const appAdmin = await getApplicationAdminByUser(user.id);
      const data     = await getManagersByAppAdmin(appAdmin.id);
      setRows(Array.isArray(data) ? data.filter(r => !r.isDeleted) : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Field helper ──────────────────────────────────────────────────────────
  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q
      || r.username?.toLowerCase().includes(q)
      || r.email?.toLowerCase().includes(q)
      || r.nic?.toLowerCase().includes(q);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createManager({
        username:    createForm.username,
        email:       createForm.email,
        password:    createForm.password,
        nic:         createForm.nic     || undefined,
        phoneNumber: createForm.phoneNumber || undefined,
      });
      success('Manager created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({ nic: row.nic ?? '' });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateManager(editTarget.id, {
        nic: editForm.nic || undefined,
      });
      success('Manager updated successfully');
      closeEdit();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteManager(deleteTarget.id);
      success('Manager deleted');
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
        title="Manager Management"
        subtitle="Create and manage managers for your school."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Manager
          </button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, email or NIC…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        error={fetchErr}
        emptyMessage="No managers found. Add one to get started."
        onRetry={fetchList}
      />

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Add Manager"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Manager'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit — ${editTarget?.username ?? ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete Manager"
        confirmLabel="Delete"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete manager <strong>{deleteTarget?.username}</strong>?
          This action cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default ManagersPage;
