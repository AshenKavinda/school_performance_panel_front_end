import { useCallback, useEffect, useState } from 'react';
import {
  getSubjectsByOperator, createSubject, updateSubject, deleteSubject,
} from '../../services/managementService';
import { useOperator }   from '../../context/OperatorContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Validation ────────────────────────────────────────────────────────────────
const validate = (f) => {
  const errs = {};
  if (!f.name.trim())  errs.name        = 'Subject name is required';
  const cv = parseFloat(f.creditValue);
  if (f.creditValue === '' || isNaN(cv)) errs.creditValue = 'Credit value is required';
  else if (cv < 1 || cv > 10)           errs.creditValue = 'Credit value must be between 1 and 10';
  return errs;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const SubjectFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput label="Subject Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Mathematics"
    />
    <FormInput label="Credit Value (1–10)" name="creditValue" type="number" required
      value={form.creditValue} onChange={onChange} error={errors.creditValue}
      placeholder="e.g. 4"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', creditValue: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Subject Name',
    render: (row) => <span className="font-semibold text-gray-800 dark:text-gray-200">{row.name ?? '—'}</span>,
  },
  {
    key: 'creditValue',
    header: 'Credit Value',
    render: (row) => (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
        {row.creditValue ?? '—'} credits
      </span>
    ),
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
        <button onClick={() => onEdit(row)}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          Edit
        </button>
        <button onClick={() => onDelete(row)}
          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition">
          Delete
        </button>
      </div>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const SubjectsPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,   setSearch]   = useState('');

  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_FORM);
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
      const data = await getSubjectsByOperator(operatorId);
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
    return !q || r.name?.toLowerCase().includes(q);
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createSubject({ name: createForm.name.trim(), creditValue: parseFloat(createForm.creditValue) });
      success('Subject created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ name: row.name ?? '', creditValue: String(row.creditValue ?? '') }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validate(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateSubject(editTarget.id, { name: editForm.name.trim(), creditValue: parseFloat(editForm.creditValue) });
      success('Subject updated successfully');
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
      await deleteSubject(deleteTarget.id);
      success('Subject deleted');
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
        title="Subjects"
        subtitle="Define the subjects taught in your school"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subject
          </button>
        }
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <input type="text" placeholder="Search subjects…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      {fetchErr ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No subjects found." />
        </div>
      )}

      <Modal open={createOpen} onClose={closeCreate} title="Add Subject"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        }
      >
        <SubjectFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Subject"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEdit} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <SubjectFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Subject"
        message={`Are you sure you want to delete subject "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default SubjectsPage;
