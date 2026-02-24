import { useCallback, useEffect, useState } from 'react';
import {
  getClassesByOperator, createClass, updateClass, deleteClass,
  getSectionsByOperator,
} from '../../services/managementService';
import { useOperator }   from '../../context/OperatorContext';
import { useToast }      from '../../context/ToastContext';
import { parseApiError } from '../../utils/validation';
import {
  DataTable, Modal, FormInput, ConfirmDialog, PageHeader,
} from '../../components/common';

const CLASS_TYPES = ['SUBJECT_BASE', 'MODULE_BASE'];

// ── Validation ────────────────────────────────────────────────────────────────
const validateCreate = (f) => {
  const errs = {};
  if (!f.name.trim())      errs.name          = 'Class name is required';
  if (!f.sectionId)        errs.sectionId     = 'Please select a section';
  if (!f.academicYear.trim()) errs.academicYear = 'Academic year is required';
  if (!f.classType)        errs.classType     = 'Please select a class type';
  return errs;
};
const validateEdit = (f) => {
  const errs = {};
  if (!f.name.trim())         errs.name         = 'Class name is required';
  if (!f.sectionId)           errs.sectionId    = 'Please select a section';
  if (!f.academicYear.trim()) errs.academicYear = 'Academic year is required';
  if (!f.classType)           errs.classType    = 'Please select a class type';
  return errs;
};

// ── Form field components — MODULE LEVEL ──────────────────────────────────────
const CreateFormFields = ({ form, errors, onChange, sections }) => (
  <div className="space-y-4">
    <FormInput label="Class Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Grade 10 — A"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Section <span className="text-red-500">*</span>
      </label>
      <select name="sectionId" value={form.sectionId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.sectionId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a section…</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {errors.sectionId && <p className="mt-1 text-xs text-red-500">{errors.sectionId}</p>}
    </div>
    <FormInput label="Academic Year" name="academicYear" required
      value={form.academicYear} onChange={onChange} error={errors.academicYear}
      placeholder="e.g. 2024/2025"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Class Type <span className="text-red-500">*</span>
      </label>
      <select name="classType" value={form.classType} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.classType ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select type…</option>
        {CLASS_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace('_', ' ')}</option>
        ))}
      </select>
      {errors.classType && <p className="mt-1 text-xs text-red-500">{errors.classType}</p>}
    </div>
  </div>
);

const EditFormFields = ({ form, errors, onChange, sections }) => (
  <div className="space-y-4">
    <FormInput label="Class Name" name="name" required
      value={form.name} onChange={onChange} error={errors.name}
      placeholder="e.g. Grade 10 — A"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Section <span className="text-red-500">*</span>
      </label>
      <select name="sectionId" value={form.sectionId} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.sectionId ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select a section…</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {errors.sectionId && <p className="mt-1 text-xs text-red-500">{errors.sectionId}</p>}
    </div>
    <FormInput label="Academic Year" name="academicYear" required
      value={form.academicYear} onChange={onChange} error={errors.academicYear}
      placeholder="e.g. 2024/2025"
    />
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Class Type <span className="text-red-500">*</span>
      </label>
      <select name="classType" value={form.classType} onChange={onChange}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${errors.classType ? 'border-red-400' : 'border-gray-200'}`}>
        <option value="">Select type…</option>
        {CLASS_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace('_', ' ')}</option>
        ))}
      </select>
      {errors.classType && <p className="mt-1 text-xs text-red-500">{errors.classType}</p>}
    </div>
  </div>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMPTY_CREATE = { name: '', sectionId: '', academicYear: '', classType: '' };
const EMPTY_EDIT   = { name: '', sectionId: '', academicYear: '', classType: '' };

// ── Type badge ────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  if (!type) return <span className="text-gray-400 italic text-xs">—</span>;
  const colors = {
    SUBJECT_BASE: 'bg-blue-100 text-blue-700',
    MODULE_BASE:  'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type.replace('_', ' ')}
    </span>
  );
};

// ── Column definitions ────────────────────────────────────────────────────────
const buildColumns = (sections, onEdit, onDelete) => [
  {
    key: 'name',
    header: 'Class Name',
    render: (row) => <span className="font-semibold text-gray-800">{row.name ?? '—'}</span>,
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
    key: 'academicYear',
    header: 'Academic Year',
    render: (row) => <span className="text-sm text-gray-600">{row.academicYear ?? '—'}</span>,
  },
  {
    key: 'classType',
    header: 'Type',
    render: (row) => <TypeBadge type={row.classType} />,
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
const ClassesPage = () => {
  const { success, error: toastError } = useToast();

  const [rows,     setRows]     = useState([]);
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [search,        setSearch]        = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterYear,    setFilterYear]    = useState('');

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
      const [clsData, secData] = await Promise.all([
        getClassesByOperator(operatorId),
        getSectionsByOperator(operatorId),
      ]);
      setRows(Array.isArray(clsData) ? clsData.filter(r => !r.isDeleted) : []);
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
    const matchSection = !filterSection || String(r.sectionId) === filterSection;
    const matchType    = !filterType    || r.classType === filterType;
    const matchYear    = !filterYear    || r.academicYear === filterYear;
    return matchSearch && matchSection && matchType && matchYear;
  });

  // Unique sorted academic years from all rows
  const uniqueYears = [...new Set(rows.map(r => r.academicYear).filter(Boolean))].sort();

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate  = () => { setCreateForm(EMPTY_CREATE); setCreateErrors({}); setCreateOpen(true); };
  const closeCreate = () => setCreateOpen(false);

  const handleCreate = async () => {
    const errs = validateCreate(createForm);
    if (Object.keys(errs).length) { setCreateErrors(errs); return; }
    setCreating(true);
    try {
      await createClass({
        name:         createForm.name.trim(),
        sectionId:    createForm.sectionId,
        academicYear: createForm.academicYear.trim(),
        classType:    createForm.classType,
      });
      success('Class created successfully');
      closeCreate();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit  = (row) => { setEditTarget(row); setEditForm({ name: row.name ?? '', sectionId: row.sectionId ?? '', academicYear: row.academicYear ?? '', classType: row.classType ?? '' }); setEditErrors({}); };
  const closeEdit = () => setEditTarget(null);

  const handleSave = async () => {
    const errs = validateEdit(editForm);
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSaving(true);
    try {
      await updateClass(editTarget.id, { name: editForm.name.trim(), sectionId: editForm.sectionId, academicYear: editForm.academicYear.trim(), classType: editForm.classType });
      success('Class updated successfully');
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
      await deleteClass(deleteTarget.id);
      success('Class deleted');
      closeDelete();
      fetchList();
    } catch (e) {
      toastError(parseApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = buildColumns(sections, openEdit, openDelete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        subtitle="Create and manage classes within sections"
        action={
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Class
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search by class name…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">All years</option>
          {uniqueYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">All sections</option>
          {sections.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent">
          <option value="">All types</option>
          {CLASS_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      {fetchErr ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{fetchErr}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <DataTable columns={columns} data={filteredRows} loading={loading} emptyMessage="No classes found." />
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={closeCreate} title="Add Class"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition">Cancel</button>
            <button onClick={handleCreate} disabled={creating}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
              {creating ? 'Creating…' : 'Create Class'}
            </button>
          </div>
        }
      >
        <CreateFormFields form={createForm} errors={createErrors} onChange={setField(setCreateForm)} sections={sections} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={closeEdit} title="Edit Class"
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
        <EditFormFields form={editForm} errors={editErrors} onChange={setField(setEditForm)} sections={sections} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={closeDelete}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Class"
        message={`Are you sure you want to delete class "${deleteTarget?.name}"? All enrollments and timetables for this class will be affected.`}
      />
    </div>
  );
};

export default ClassesPage;
