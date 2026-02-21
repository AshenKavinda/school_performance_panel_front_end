/**
 * Maps each user role to its dashboard route.
 * Imported by AuthContext and any component that needs to resolve
 * a role to a path without pulling in React context.
 */
export const ROLE_ROUTES = {
  ADMIN: '/admin/dashboard',
  APPLICATION_ADMIN: '/app-admin/dashboard',
  MANAGER: '/manager/dashboard',
  OPERATOR: '/operator/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
  GUEST: '/',
};
