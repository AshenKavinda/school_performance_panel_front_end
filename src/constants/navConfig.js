/**
 * navConfig.js — per-role sidebar navigation items.
 * Each item: { path, label, icon (string id) }
 * Icons are referenced by name and rendered in DashboardLayout via the ICONS map.
 */

export const NAV_CONFIG = {
  ADMIN: [
    { path: '/admin/dashboard',             label: 'Overview',           icon: 'home' },
    { path: '/admin/application-admins',    label: 'School Accounts',    icon: 'school' },
    { path: '/admin/admins',                label: 'Admin Accounts',     icon: 'shield' },
    { path: '/admin/packages',              label: 'Packages',           icon: 'package' },
    { path: '/admin/payments',              label: 'Payments',           icon: 'credit-card' },
    { path: '/admin/users',                 label: 'Users',              icon: 'users' },
    { path: '/admin/gpa-grading',           label: 'GPA Grading',        icon: 'chart' },
    { path: '/admin/subject-grading',       label: 'Subject Grading',    icon: 'star' },
    { path: '/admin/timeslots',             label: 'Time Slots',         icon: 'clock' },
  ],

  APPLICATION_ADMIN: [
    { path: '/app-admin/dashboard',         label: 'Overview',           icon: 'home' },
    { path: '/app-admin/subscription',      label: 'Subscription',       icon: 'credit-card' },
    { path: '/app-admin/managers',          label: 'Managers',           icon: 'users' },
    { path: '/app-admin/operators',         label: 'Operators',          icon: 'briefcase' },
    { path: '/app-admin/profile',           label: 'Profile',            icon: 'user' },
  ],

  MANAGER: [
    { path: '/manager/dashboard',           label: 'Overview',           icon: 'home' },
    { path: '/manager/operators',           label: 'Operators',          icon: 'briefcase' },
    { path: '/manager/teachers',            label: 'Teachers',           icon: 'academic' },
    { path: '/manager/students',            label: 'Students',           icon: 'users' },
    { path: '/manager/classes',             label: 'Classes & Sections', icon: 'grid' },
    { path: '/manager/profile',             label: 'Profile',            icon: 'user' },
  ],

  OPERATOR: [
    { path: '/operator/dashboard',          label: 'Overview',           icon: 'home' },
    { path: '/operator/clusters',           label: 'Clusters',           icon: 'folder' },
    { path: '/operator/sections',           label: 'Sections',           icon: 'grid' },
    { path: '/operator/classes',            label: 'Classes',            icon: 'academic' },
    { path: '/operator/subjects',           label: 'Subjects',           icon: 'book' },
    { path: '/operator/modules',            label: 'Modules',            icon: 'puzzle' },
    { path: '/operator/teachers',           label: 'Teachers',           icon: 'users' },
    { path: '/operator/students',           label: 'Students',           icon: 'group' },
    { path: '/operator/enrollments',        label: 'Enrollments',        icon: 'clipboard' },
    { path: '/operator/teacher-assignments',label: 'Teacher Assignments',icon: 'assignment' },
    { path: '/operator/timetable',          label: 'Timetable',          icon: 'calendar' },
    { path: '/operator/profile',            label: 'Profile',            icon: 'user' },
  ],

  TEACHER: [
    { path: '/teacher/dashboard',           label: 'Overview',           icon: 'home' },
    { path: '/teacher/timetable',           label: 'My Timetable',       icon: 'calendar' },
    { path: '/teacher/assignments',         label: 'My Assignments',     icon: 'assignment' },
    { path: '/teacher/students',            label: 'Class Students',     icon: 'users' },
    { path: '/teacher/mark-entry',          label: 'Mark Entry',         icon: 'edit' },
    { path: '/teacher/analytics',           label: 'Analytics',          icon: 'chart' },
    { path: '/teacher/profile',             label: 'Profile',            icon: 'user' },
  ],

  STUDENT: [
    { path: '/student/dashboard',           label: 'Overview',           icon: 'home' },
    { path: '/student/profile',             label: 'My Profile',         icon: 'user' },
    { path: '/student/enrollments',         label: 'My Enrollments',     icon: 'clipboard' },
    { path: '/student/marks',               label: 'My Marks',           icon: 'chart' },
    { path: '/student/timetable',           label: 'My Timetable',       icon: 'calendar' },
    { path: '/student/analytics',           label: 'Analytics',          icon: 'chart' },
  ],
};
