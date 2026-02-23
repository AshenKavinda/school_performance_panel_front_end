import { useCallback, useEffect, useState } from 'react';
import {
  getStudentsByOperator, createStudent, updateStudent, deleteStudent,
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
  if (!f.globalStudentCode.trim()) errs.globalStudentCode = 'Global student code is required';
  return errs;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const CreateFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
      The global student code links this student record to the student's platform-wide account.
    </div>
    <FormInput label="Global Student Code" name="globalStudentCode" required
      value={form.globalStudentCode} onChange={onChange} error={errors.globalStudentCode}
      placeholder="Enter student's global code"
    />
    <FormInput label="Index Number" name="indexNumber"
      value={form.indexNumber} onChange={onChange} error={errors.indexNumber}
      placeholder="School index number (optional)"
    />
    <FormInput label="Address" name="address"
      value={form.address} onChange={onChange} error={errors.address}
      placeholder="Student address (optional)"
    />
  </div>
);

const EditFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Index Number" name="indexNumber"
      value={form.indexNumber} onChange={onChange} error={errors.indexNumber}
      placeholder="School index number"
    />
    <FormInput label="Address" name="address"
      value={form.address} onChange={onChange} error={errors.address}
      placeholder="Student address"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_CREATE = { globalStudentCode: '', indexNumber: '', address: '' };
const EMPTY_EDIT   = { indexNumber: '', address: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'globalStudentCode',
    header: 'Student Code',
    render: (row) => (
      <span className="font-mono text-sm font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
        {row.globalStudentCode ?? '—'}
      </span>
    ),
  },
  {
    key: 'indexNumber',
    header: 'Index No.',
    render: (row) => row.indexNumber ?? <span className="text-gray-400 italic text-sm">—</span>,
  },
  {
    key: 'address',
    header: 'Address',
    render: (row) => (
      <span className="text-sm text-gray-600 max-w-[200px] truncate block">
        {row.address ?? <span className="text-gray-400 italic">—</span>}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Registered',
    render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
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
const StudentsPage = () => {
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
      const data = await getStudentsByOperator(operatorId);
      console.log('Fetched students:', data);
      setRows(Array.isArray(data) ? data.filter(r => !r.isDeleted) : []);
    } catch (e) {
      console.error('Error fetching students:', e);
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
      || r.globalStudentCode?.toLowerCase().includes(q)
      || r.indexNumber?.toLowerCase().includes(q)
      || r.address?.toLowerCase().includes(q);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createStudent({
        globalStudentCode: createForm.globalStudentCode.trim(),
        indexNumber:       createForm.indexNumber || undefined,
        address:           createForm.address     || undefined,
      });
      success('Student registered successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ indexNumber: row.indexNumber ?? '', address: row.address ?? '' }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudent(editTarget.id, {
        indexNumber: editForm.indexNumber || undefined,
        address:     editForm.address     || undefined,
      });
      success('Student updated successfully');
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
      await deleteStudent(deleteTarget.id);
      success('Student removed');
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
        title="Students"
        subtitle="Register and manage student records for your school"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Student
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <input type="text" placeholder="Search by student code, index number or address…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No students found." />
        </div>
      )}

      <Modal open={createOpen} onClose={closeCreate} title="Register Student"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Registering…' : 'Register Student'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Student"
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
            Student Code: <span className="font-mono font-semibold text-teal-700">{editTarget.globalStudentCode}</span>
          </p>
        )}
        <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Student"
        message={`Are you sure you want to remove student "${deleteTarget?.globalStudentCode}"? This will remove them from all class enrollments.`}
      />
    </div>
  );
};

export default StudentsPage;
