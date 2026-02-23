import { useCallback, useEffect, useState } from 'react';
import {
  getTeachersByOperator, createTeacher, updateTeacher, deleteTeacher,
} from '../../services/managementService';
import { useOperator }   from '../../context/OperatorContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Validation ────────────────────────────────────────────────────────────────
const validateCreate = (f) => {
  const errs = {};
  if (!f.username.trim()) errs.username = 'Username is required';
  if (!f.email.trim())    errs.email    = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Enter a valid email address';
  if (!f.password.trim()) errs.password = 'Password is required';
  else if (f.password.length < 6)                        errs.password = 'Password must be at least 6 characters';
  return errs;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const CreateFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Username" name="username" required
      value={form.username} onChange={onChange} error={errors.username}
      placeholder="Enter username"
    />
    <FormInput label="Email" name="email" type="email" required
      value={form.email} onChange={onChange} error={errors.email}
      placeholder="teacher@school.com"
    />
    <FormInput label="Password" name="password" type="password" required
      value={form.password} onChange={onChange} error={errors.password}
      placeholder="Min. 6 characters"
    />
    <FormInput label="Teacher ID" name="teacherId"
      value={form.teacherId} onChange={onChange} error={errors.teacherId}
      placeholder="Institutional teacher ID (optional)"
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
    <FormInput label="Teacher ID" name="teacherId"
      value={form.teacherId} onChange={onChange} error={errors.teacherId}
      placeholder="Institutional teacher ID"
    />
    <FormInput label="NIC" name="nic"
      value={form.nic} onChange={onChange} error={errors.nic}
      placeholder="National ID"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_CREATE = { username: '', email: '', password: '', teacherId: '', nic: '', phoneNumber: '' };
const EMPTY_EDIT   = { teacherId: '', nic: '' };

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
    render: (row) => <span className="text-gray-600 text-sm">{row.email ?? '—'}</span>,
  },
  {
    key: 'teacherId',
    header: 'Teacher ID',
    render: (row) => row.teacherId ?? <span className="text-gray-400 italic text-sm">—</span>,
  },
  {
    key: 'nic',
    header: 'NIC',
    render: (row) => row.nic ?? <span className="text-gray-400 italic text-sm">—</span>,
  },
  {
    key: 'phoneNumber',
    header: 'Phone',
    render: (row) => row.phoneNumber ?? <span className="text-gray-400 italic text-sm">—</span>,
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => onEdit(row)}
          className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100 transition">
          Edit
        </button>
        <button onClick={() => onDelete(row)}
          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition">
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const TeachersPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,   setSearch]   = useState('');

  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_CREATE);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { operatorId } = useOperator();

  const fetchList = useCallback(async () => {
    if (!operatorId) { setLoading(false); return; }
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getTeachersByOperator(operatorId);
      setRows(Array.isArray(data) ? data.filter(r => !r.isDeleted) : []);
    } catch (e) {
      setFetchErr(parseApiError(e));
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const setField = (setter) => (e) => {
    const { name, value } = e.target;
    setter((f) => ({ ...f, [name]: value }));
  };

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q
      || r.username?.toLowerCase().includes(q)
      || r.email?.toLowerCase().includes(q)
      || r.teacherId?.toLowerCase().includes(q)
      || r.nic?.toLowerCase().includes(q);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createTeacher({
        username:    createForm.username.trim(),
        email:       createForm.email.trim(),
        password:    createForm.password,
        teacherId:   createForm.teacherId   || undefined,
        nic:         createForm.nic         || undefined,
        phoneNumber: createForm.phoneNumber || undefined,
      });
      success('Teacher created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ teacherId: row.teacherId ?? '', nic: row.nic ?? '' }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeacher(editTarget.id, {
        teacherId: editForm.teacherId || undefined,
        nic:       editForm.nic       || undefined,
      });
      success('Teacher updated successfully');
      closeEdit();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete  = (row) => setDeleteTarget(row);
  const closeDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTeacher(deleteTarget.id);
      success('Teacher deleted');
      closeDelete();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(openEdit, openDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="Manage teacher accounts for your school"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Teacher
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <input type="text" placeholder="Search by username, email, teacher ID or NIC…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No teachers found." />
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={closeCreate} title="Add Teacher"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Teacher'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Teacher"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editTarget && (
          <p className="text-xs text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
            Username: <span className="font-medium text-gray-700">{editTarget.username}</span>
            {' · '}Email: <span className="font-medium text-gray-700">{editTarget.email}</span>
          </p>
        )}
        <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Teacher"
        message={`Are you sure you want to delete teacher "${deleteTarget?.username}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default TeachersPage;
