import { useCallback, useEffect, useState } from 'react';
import {
  getModulesByOperator, createModule, updateModule, deleteModule,
  getSubjectsByOperator, getSectionsByOperator,
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
  if (!f.name.trim())   errs.name      = 'Module name is required';
  if (!f.subjectId)     errs.subjectId = 'Please select a subject';
  if (!f.sectionId)     errs.sectionId = 'Please select a section';
  const w = parseFloat(f.moduleWeight);
  if (f.moduleWeight === '' || isNaN(w)) errs.moduleWeight = 'Module weight is required';
  else if (w < 1 || w > 100)            errs.moduleWeight = 'Weight must be between 1 and 100';
  return errs;
};
const validateEdit = (f) => {
  const errs = {};
  if (!f.name.trim())   errs.name      = 'Module name is required';
  if (!f.subjectId)     errs.subjectId = 'Please select a subject';
  if (!f.sectionId)     errs.sectionId = 'Please select a section';
  const w = parseFloat(f.moduleWeight);
  if (f.moduleWeight === '' || isNaN(w)) errs.moduleWeight = 'Module weight is required';
  else if (w < 1 || w > 100)            errs.moduleWeight = 'Weight must be between 1 and 100';
  return errs;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const CreateFormFields = ({ form, errors, onChange, subjects, sections }) => (
  <div className="space-y-4">
    <FormInput label="Module Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Introduction to Algebra"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Subject <span className="text-red-500">*</span>
      </label>
      <select name="subjectId" value={form.subjectId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.subjectId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a subject…</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {errors.subjectId && <p className="mt-1 text-xs text-red-500">{errors.subjectId}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Section <span className="text-red-500">*</span>
      </label>
      <select name="sectionId" value={form.sectionId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.sectionId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a section…</option>
        {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {errors.sectionId && <p className="mt-1 text-xs text-red-500">{errors.sectionId}</p>}
    </div>
    <FormInput label="Module Weight (1–100)" name="moduleWeight" type="number" required
      value={form.moduleWeight} onChange={onChange} error={errors.moduleWeight}
      placeholder="e.g. 30"
    />
  </div>
);

const EditFormFields = ({ form, errors, onChange, subjects, sections }) => (
  <div className="space-y-4">
    <FormInput label="Module Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Introduction to Algebra"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Subject <span className="text-red-500">*</span>
      </label>
      <select name="subjectId" value={form.subjectId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.subjectId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a subject…</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {errors.subjectId && <p className="mt-1 text-xs text-red-500">{errors.subjectId}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Section <span className="text-red-500">*</span>
      </label>
      <select name="sectionId" value={form.sectionId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.sectionId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a section…</option>
        {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {errors.sectionId && <p className="mt-1 text-xs text-red-500">{errors.sectionId}</p>}
    </div>
    <FormInput label="Module Weight (1–100)" name="moduleWeight" type="number" required
      value={form.moduleWeight} onChange={onChange} error={errors.moduleWeight}
      placeholder="e.g. 30"
    />
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_CREATE = { name: '', subjectId: '', sectionId: '', moduleWeight: '' };
const EMPTY_EDIT   = { name: '', subjectId: '', sectionId: '', moduleWeight: '' };

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (subjects, sections, onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Module Name',
    render: (row) => <span className="font-semibold text-gray-800">{row.name ?? '—'}</span>,
  },
  {
    key: 'subjectId',
    header: 'Subject',
    render: (row) => {
      const sub = subjects.find(s => s.id === row.subjectId);
      return sub ? <span className="text-sm text-gray-600">{sub.name}</span> : <span className="text-gray-400 italic text-sm">—</span>;
    },
  },
  {
    key: 'sectionId',
    header: 'Section',
    render: (row) => {
      const sec = sections.find(s => s.id === row.sectionId);
      return sec ? <span className="text-sm text-gray-600">{sec.name}</span> : <span className="text-gray-400 italic text-sm">—</span>;
    },
  },
  {
    key: 'moduleWeight',
    header: 'Weight',
    render: (row) => (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">
        {row.moduleWeight ?? '—'}%
      </span>
    ),
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
const ModulesPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,        setSearch]        = useState('');
  const [filterSubject, setFilterSubject] = useState('');

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
      const [modData, subData, secData] = await Promise.all([
        getModulesByOperator(operatorId),
        getSubjectsByOperator(operatorId),
        getSectionsByOperator(operatorId),
      ]);
      setRows(Array.isArray(modData) ? modData.filter(r => !r.isDeleted) : []);
      setSubjects(Array.isArray(subData) ? subData.filter(r => !r.isDeleted) : []);
      setSections(Array.isArray(secData) ? secData.filter(r => !r.isDeleted) : []);
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
    const matchSearch  = !q || r.name?.toLowerCase().includes(q);
    const matchSubject = !filterSubject || String(r.subjectId) === filterSubject;
    return matchSearch && matchSubject;
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createModule({
        name:         createForm.name.trim(),
        subjectId:    createForm.subjectId,
        sectionId:    createForm.sectionId,
        moduleWeight: parseFloat(createForm.moduleWeight),
      });
      success('Module created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ name: row.name ?? '', subjectId: row.subjectId ?? '', sectionId: row.sectionId ?? '', moduleWeight: String(row.moduleWeight ?? '') }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validateEdit(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateModule(editTarget.id, { name: editForm.name.trim(), subjectId: editForm.subjectId, sectionId: editForm.sectionId, moduleWeight: parseFloat(editForm.moduleWeight) });
      success('Module updated successfully');
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
      await deleteModule(deleteTarget.id);
      success('Module deleted');
      closeDelete();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(subjects, sections, openEdit, openDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        subtitle="Configure module-based subject components"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Module
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search modules…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
      </div>

      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No modules found." />
        </div>
      )}

      <Modal open={createOpen} onClose={closeCreate} title="Add Module"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Module'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} subjects={subjects} sections={sections} />
      </Modal>

      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Module"
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
          <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} subjects={subjects} sections={sections} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Module"
        message={`Are you sure you want to delete module "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default ModulesPage;
