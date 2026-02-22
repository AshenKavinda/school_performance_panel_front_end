import DashboardLayout from '../layout/DashboardLayout';

const StudentDashboard = () => {
  return (
    <DashboardLayout title="Student Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Enrolled Classes', value: '—', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'Subjects', value: '—', color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Recent Marks', value: '—', color: 'bg-teal-50 text-teal-700 border-teal-200' },
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm">Student Dashboard — Phase 8 will add marks, timetable, and enrollments.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
