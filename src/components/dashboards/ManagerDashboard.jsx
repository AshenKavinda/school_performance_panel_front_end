import DashboardLayout from '../layout/DashboardLayout';

const NAV = [
  { path: '/manager/dashboard', label: 'Overview' },
  { path: '/manager/operators', label: 'Operators' },
  { path: '/manager/teachers', label: 'Teachers' },
  { path: '/manager/students', label: 'Students' },
  { path: '/manager/classes', label: 'Classes & Sections' },
  { path: '/manager/profile', label: 'Profile' },
];

const ManagerDashboard = () => {
  return (
    <DashboardLayout title="Manager Dashboard" navItems={NAV}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Operators', value: '—', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Teachers', value: '—', color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { label: 'Students', value: '—', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
            { label: 'Classes', value: '—', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">Manager Dashboard — Phase 7 will add full read-only views.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
