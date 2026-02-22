import { useCallback, useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../../services/managementService';
import { useToast }     from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader, Badge,
} from '../../components/common';

const ROLE_OPTIONS = [
  { value: 'ADMIN',             label: 'Admin' },
  { value: 'APPLICATION_ADMIN', label: 'Application Admin' },
  { value: 'MANAGER',           label: 'Manager' },
  { value: 'OPERATOR',          label: 'Operator' },
  { value: 'TEACHER',           label: 'Teacher' },
  { value: 'STUDENT',           label: 'Student' },
  { value: 'GUEST',             label: 'Guest' },
];

const ROLE_BADGE = {
  ADMIN:             'error',
  APPLICATION_ADMIN: 'purple',
  MANAGER:           'info',
  OPERATOR:          'teal',
  TEACHER:           'orange',
  STUDENT:           'emerald',
  GUEST:             'default',
};

const EMPTY_EDIT = { username: '', email: '', phoneNumber: '', role: 'STUDENT' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'username',
    header: 'Username',
    render: (r) => <span className="font-medium text-gray-800">{r.username ?? '—'}</span>,
  },
  { key: 'email', header: 'Email', render: (r) => r.email ?? '—' },
  {
    key: 'role',
    header: 'Role',
    render: (r) => r.role ? (
      <Badge variant={ROLE_BADGE[r.role] ?? 'default'} size="sm">{r.role.replace('_', ' ')}</Badge>
    ) : '—',
  },
  {
    key: 'isActive',
    header: 'Active',
    render: (r) => (
      <Badge variant={r.isActive ? 'success' : 'error'} size="sm">
        {r.isActive ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  {
    key: 'isVerified',
    header: 'Verified',
    render: (r) => (
      <Badge variant={r.isVerified ? 'success' : 'warning'} size="sm">
        {r.isVerified ? 'Verified' : 'Pending'}
      </Badge>
    ),
  },
  {
    key: 'createdAt',
    header: 'Joined',
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
const UsersPage = () => {
  const { success, error: toastError } = useToast();

  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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
      const data = await getUsers();
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
    const matchSearch =
      (r.username    ?? '').toLowerCase().includes(q) ||
      (r.email       ?? '').toLowerCase().includes(q) ||
      (r.phoneNumber ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || r.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validateEdit = (f) => {
    const errs = {};
    if (f.email && !/\S+@\S+\.\S+/.test(f.email)) errs.email = 'Enter a valid email';
    return errs;
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      username:    row.username    ?? '',
      email:       row.email       ?? '',
      phoneNumber: row.phoneNumber ?? '',
      role:        row.role        ?? 'STUDENT',
    });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validateEdit(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setSaving(true);
    try {
      await updateUser(editTarget.id, {
        username:    editForm.username    || null,
        email:       editForm.email       || null,
        phoneNumber: editForm.phoneNumber || null,
        role:        editForm.role,
      });
      success('User updated successfully');
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
      await deleteUser(deleteTarget.id);
      success('User deleted');
      setDeleteTarget(null);
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, setDeleteTarget);

  // Role counts for the filter strip
  const roleCounts = rows.reduce((acc, r) => {
    acc[r.role] = (acc[r.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="View and manage all platform users across every role."
      />

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by username, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
        >
          <option value="all">All Roles ({rows.length})</option>
          {ROLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label} ({roleCounts[value] ?? 0})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={fetchErr}
        emptyMessage="No users match the current filters."
        onRetry={fetchList}
      />

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit User — ${editTarget?.username ?? ''}`}
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
        <div className="space-y-4">
          <FormInput
            label="Username" name="username"
            value={editForm.username}
            onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
            error={editErrors.username}
          />
          <FormInput
            label="Email" name="email" type="email"
            value={editForm.email}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            error={editErrors.email}
          />
          <FormInput
            label="Phone Number" name="phoneNumber"
            value={editForm.phoneNumber}
            onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            error={editErrors.phoneNumber}
            hint="Optional"
          />
          <FormInput
            label="Role" name="role" type="select"
            value={editForm.role}
            onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
            options={ROLE_OPTIONS}
            error={editErrors.role}
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
        title="Delete User"
        confirmLabel="Delete"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to permanently delete <strong>{deleteTarget?.username}</strong>?{' '}
          This will remove their account and all associated data.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default UsersPage;
