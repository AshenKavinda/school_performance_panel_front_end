import { useCallback, useEffect, useState } from 'react';
import { useManager } from '../../context/ManagerContext';
import { getOperatorsByAppAdmin, getTeachersByOperator } from '../../services/managementService';
import { PageHeader, LoadingSpinner } from '../../components/common';

const ViewTeachers = () => {
  const { managerProfile, loading: ctxLoading } = useManager();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');

  const fetchTeachers = useCallback(async () => {
    if (!managerProfile?.createdBy) return;
    setLoading(true);
    setError(null);
    try {
      // Get all operators under the same ApplicationAdmin, then fetch teachers for each
      const operators = await getOperatorsByAppAdmin(managerProfile.createdBy);
      const ops = Array.isArray(operators) ? operators : [];
      const results = await Promise.all(
        ops.map(op => getTeachersByOperator(op.id).catch(() => []))
      );
      // Merge and deduplicate by id
      const map = new Map();
      results.flat().forEach(t => { if (t?.id && !map.has(t.id)) map.set(t.id, t); });
      setTeachers(Array.from(map.values()));
    } catch (e) {
      console.error('[ViewTeachers] fetch failed', e);
      setError('Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, [managerProfile?.createdBy]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const filtered = teachers.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.username?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.nic?.toLowerCase().includes(q) ||
      t.teacherId?.toLowerCase().includes(q)
    );
  });

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" subtitle="All teachers across your institution" />

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, NIC, or Teacher ID…"
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
          {search ? 'No teachers match your search.' : 'No teachers found.'}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">NIC</th>
                  <th className="py-3 px-4 font-medium">Teacher ID</th>
                  <th className="py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{t.username ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{t.email ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{t.phoneNumber ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{t.nic ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{t.teacherId ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} teacher{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTeachers;
