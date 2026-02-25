import { useCallback, useEffect, useState } from 'react';
import { useManager } from '../../context/ManagerContext';
import { getOperatorsByAppAdmin, getStudentsByOperator } from '../../services/managementService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const ViewStudents = () => {
  const { managerProfile, loading: ctxLoading } = useManager();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');

  const fetchStudents = useCallback(async () => {
    if (!managerProfile?.createdBy) return;
    setLoading(true);
    setError(null);
    try {
      const operators = await getOperatorsByAppAdmin(managerProfile.createdBy);
      const ops = Array.isArray(operators) ? operators : [];
      const results = await Promise.all(
        ops.map(op => getStudentsByOperator(op.id).catch(() => []))
      );
      const map = new Map();
      results.flat().forEach(s => { if (s?.id && !map.has(s.id)) map.set(s.id, s); });
      setStudents(Array.from(map.values()));
    } catch (e) {
      console.error('[ViewStudents] fetch failed', e);
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [managerProfile?.createdBy]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.indexNumber?.toLowerCase().includes(q) ||
      s.globalStudentCode?.toLowerCase().includes(q)
    );
  });

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="All students across your institution" />

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, index number, or student code…"
          className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
          {search ? 'No students match your search.' : 'No students found.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">First Name</th>
                  <th className="py-3 px-4 font-medium">Last Name</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Index No.</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{s.firstName ?? '—'}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{s.lastName ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{s.email ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{s.indexNumber ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{s.phone ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStudents;
