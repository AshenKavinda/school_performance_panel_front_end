import { useCallback, useEffect, useState } from 'react';
import {
  getMySubjectGradings, createSubjectGrading, updateSubjectGrading, deleteSubjectGrading,
} from '../../services/gradingService';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

// ── Empty form constant ───────────────────────────────────────────────────────
const EMPTY_FORM = { grade: '', minMark: '', maxMark: '' };

// ── Validation ────────────────────────────────────────────────────────────────
const validateForm = (f) => {
  const errs = {};
  if (!f.grade.trim()) errs.grade = 'Grade label is required (e.g. A, B, C)';

  const min = Number(f.minMark);
  const max = Number(f.maxMark);

  if (f.minMark === '' || isNaN(min) || min < 0)    errs.minMark = 'Enter a valid minimum mark (≥ 0)';
  if (f.maxMark === '' || isNaN(max) || max < 0)    errs.maxMark = 'Enter a valid maximum mark (≥ 0)';
  if (!errs.minMark && !errs.maxMark && min >= max) errs.maxMark = 'Maximum mark must be greater than minimum';

  return errs;
};

// ── Form fields component — MODULE LEVEL ──────────────────────────────────────
const SubjectFormFields = ({ form, errors, onChange }) => (
  <div className="space-y-4">
    <FormInput
      label="Grade Label" name="grade" required
      value={form.grade} onChange={onChange} error={errors.grade}
      placeholder="e.g. A, A+, B, B-, C, F"
    />
    <div className="grid grid-cols-2 gap-3">
      <FormInput
        label="Min Mark" name="minMark" type="number" required
        value={form.minMark} onChange={onChange} error={errors.minMark}
        hint="Inclusive lower bound"
      />
      <FormInput
        label="Max Mark" name="maxMark" type="number" required
        value={form.maxMark} onChange={onChange} error={errors.maxMark}
        hint="Inclusive upper bound"
      />
    </div>
  </div>
);

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (onEdit, onDelete) => [
  {
    key: 'grade',
    header: 'Grade',
    render: (row) => (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-800 font-bold text-sm">
        {row.grade ?? '—'}
      </span>
    ),
  },
  {
    key: 'minMark',
    header: 'Min Mark',
    render: (row) => row.minMark != null ? <span className="font-medium">{row.minMark}</span> : '—',
  },
  {
    key: 'maxMark',
    header: 'Max Mark',
    render: (row) => row.maxMark != null ? <span className="font-medium">{row.maxMark}</span> : '—',
  },
  {
    key: 'range',
    header: 'Mark Range',
    render: (row) =>
      row.minMark != null && row.maxMark != null
        ? <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{row.minMark} – {row.maxMark}</span>
        : '—',
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
const SubjectGradingPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  // Create modal
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createForm,   setCreateForm]   = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [creating,     setCreating]     = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [saving,     setSaving]     = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const data = await getMySubjectGradings();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => (b.minMark ?? 0) - (a.minMark ?? 0))
        : [];
      setRows(sorted);
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

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateForm(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createSubjectGrading({
        grade:   createForm.grade,
        minMark: Number(createForm.minMark),
        maxMark: Number(createForm.maxMark),
      });
      success('Subject grade label created');
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
    setEditForm({
      grade:   row.grade   ?? '',
      minMark: row.minMark != null ? String(row.minMark) : '',
      maxMark: row.maxMark != null ? String(row.maxMark) : '',
    });
    setEditErrors({});
  };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validateForm(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateSubjectGrading(editTarget.id, {
        grade:   editForm.grade,
        minMark: Number(editForm.minMark),
        maxMark: Number(editForm.maxMark),
      });
      success('Subject grade label updated');
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
      await deleteSubjectGrading(deleteTarget.id);
      success('Subject grade label deleted');
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
        title="Subject Grading Configuration"
        subtitle="Define grade labels used for subject-based assessments."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Grade Label
          </button>
        }
      />

      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
        <strong>Note:</strong> Subject grade labels apply to <strong>SUBJECT_BASE</strong> classes. Each label maps a mark range to a letter grade displayed on student reports. Bands should cover 0–100 without overlapping.
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        error={fetchErr}
        emptyMessage="No subject grade labels configured. Add one to get started."
        onRetry={fetchList}
      />

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Add Subject Grade Label"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Grade Label'}
            </button>
          </div>
        }
      >
        <SubjectFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} />
      </Modal>

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title={`Edit Grade Label — ${editTarget?.grade ?? ''}`}
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
        <SubjectFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} />
      </Modal>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete Grade Label"
        confirmLabel="Delete"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete the grade label <strong>{deleteTarget?.grade}</strong>?
          This may affect subject mark display for students.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default SubjectGradingPage;
