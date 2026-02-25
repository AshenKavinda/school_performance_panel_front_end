import { useCallback, useEffect, useState } from 'react';
import { useManager } from '../../context/ManagerContext';
import {
  getOperatorsByAppAdmin,
  getClustersByOperator,
  getSectionsByCluster,
  getClassesBySection,
} from '../../services/managementService';
import { PageHeader, LoadingSpinner } from '../../components/common';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronDown = ({ open }) => (
  <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Accordion row ─────────────────────────────────────────────────────────────
const AccordionItem = ({ label, badge, accent, open, onToggle, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition ${
        open ? `${accent} bg-opacity-10` : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      <span className="flex items-center gap-2">
        {label}
        {badge != null && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${accent} bg-opacity-20`}>{badge}</span>
        )}
      </span>
      <ChevronDown open={open} />
    </button>
    {open && <div className="px-4 py-3 bg-white dark:bg-gray-800">{children}</div>}
  </div>
);

const ViewClasses = () => {
  const { managerProfile, loading: ctxLoading } = useManager();
  const [tree, setTree]         = useState([]); // [{cluster, sections: [{section, classes: []}]}]
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [openClusters, setOpenClusters]   = useState({});
  const [openSections, setOpenSections]   = useState({});

  const fetchTree = useCallback(async () => {
    if (!managerProfile?.createdBy) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get operators under same AppAdmin
      const operators = await getOperatorsByAppAdmin(managerProfile.createdBy);
      const ops = Array.isArray(operators) ? operators : [];

      // 2. Get all clusters (merge across operators)
      const clusterResults = await Promise.all(ops.map(op => getClustersByOperator(op.id).catch(() => [])));
      const clusterMap = new Map();
      clusterResults.flat().forEach(c => { if (c?.id && !clusterMap.has(c.id)) clusterMap.set(c.id, c); });
      const clusters = Array.from(clusterMap.values());

      // 3. For each cluster, get sections
      const sectionResults = await Promise.all(clusters.map(c => getSectionsByCluster(c.id).catch(() => [])));

      // 4. For each section, get classes
      const allSections = sectionResults.flat().filter(s => s?.id);
      const classResults = await Promise.all(allSections.map(s => getClassesBySection(s.id).catch(() => [])));

      // Build section → classes map
      const sectionClassMap = new Map();
      allSections.forEach((s, idx) => {
        sectionClassMap.set(s.id, Array.isArray(classResults[idx]) ? classResults[idx] : []);
      });

      // Build tree
      const built = clusters.map((cluster, cIdx) => {
        const clSections = (sectionResults[cIdx] ?? []).filter(s => s?.id);
        return {
          cluster,
          sections: clSections.map(sec => ({
            section: sec,
            classes: sectionClassMap.get(sec.id) ?? [],
          })),
        };
      });

      setTree(built);
    } catch (e) {
      console.error('[ViewClasses] fetch failed', e);
      setError('Failed to load class hierarchy.');
    } finally {
      setLoading(false);
    }
  }, [managerProfile?.createdBy]);

  useEffect(() => { fetchTree(); }, [fetchTree]);

  const toggleCluster = (id) => setOpenClusters(p => ({ ...p, [id]: !p[id] }));
  const toggleSection = (id) => setOpenSections(p => ({ ...p, [id]: !p[id] }));

  // Summary counts
  const totalSections = tree.reduce((s, n) => s + n.sections.length, 0);
  const totalClasses  = tree.reduce((s, n) => s + n.sections.reduce((ss, sn) => ss + sn.classes.length, 0), 0);

  if (ctxLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Classes & Sections" subtitle="Academic structure hierarchy" />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-indigo-500">Clusters</p>
          <p className="text-2xl font-bold text-indigo-700">{loading ? '—' : tree.length}</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-violet-500">Sections</p>
          <p className="text-2xl font-bold text-violet-700">{loading ? '—' : totalSections}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-purple-500">Classes</p>
          <p className="text-2xl font-bold text-purple-700">{loading ? '—' : totalClasses}</p>
        </div>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      ) : tree.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
          No clusters or classes found.
        </div>
      ) : (
        <div className="space-y-3">
          {tree.map(({ cluster, sections }) => (
            <AccordionItem
              key={cluster.id}
              label={cluster.name ?? cluster.clusterName ?? 'Unnamed Cluster'}
              badge={`${sections.length} section${sections.length !== 1 ? 's' : ''}`}
              accent="text-indigo-700"
              open={!!openClusters[cluster.id]}
              onToggle={() => toggleCluster(cluster.id)}
            >
              {sections.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No sections in this cluster.</p>
              ) : (
                <div className="space-y-2 ml-2">
                  {sections.map(({ section, classes }) => (
                    <AccordionItem
                      key={section.id}
                      label={section.name ?? section.sectionName ?? 'Unnamed Section'}
                      badge={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
                      accent="text-violet-700"
                      open={!!openSections[section.id]}
                      onToggle={() => toggleSection(section.id)}
                    >
                      {classes.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">No classes in this section.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 pr-3 font-medium">Class Name</th>
                                <th className="py-2 pr-3 font-medium">Academic Year</th>
                                <th className="py-2 pr-3 font-medium">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classes.map((cls, idx) => (
                                <tr key={cls.id} className="border-b border-gray-100 hover:bg-purple-50/40">
                                  <td className="py-2 pr-3 text-gray-400">{idx + 1}</td>
                                  <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">{cls.name ?? cls.className ?? '—'}</td>
                                  <td className="py-2 pr-3 text-gray-600">{cls.academicYear ?? '—'}</td>
                                  <td className="py-2 pr-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      cls.classType === 'MODULE_BASE'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}>
                                      {cls.classType === 'MODULE_BASE' ? 'Module' : 'Subject'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </AccordionItem>
                  ))}
                </div>
              )}
            </AccordionItem>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewClasses;
