import DashboardLayout from '../layout/DashboardLayout';

const NAV = [
  { path: '/teacher/dashboard', label: 'Overview' },
  { path: '/teacher/timetable', label: 'My Timetable' },
  { path: '/teacher/assignments', label: 'My Assignments' },
  { path: '/teacher/mark-entry', label: 'Mark Entry' },
  { path: '/teacher/profile', label: 'Profile' },
];

const TeacherDashboard = () => {
  return (
    <DashboardLayout title="Teacher Dashboard" navItems={NAV}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Assigned Subjects', value: '—', color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Assigned Sections', value: '—', color: 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: "Today's Classes", value: '—', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm">Teacher Dashboard — Phase 6 will add timetable and mark entry.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
