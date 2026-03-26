export const getRoleName = (user) => user?.roleName || user?.role?.name || null;

export const getDashboardPathByRole = (roleName) => {
  if (roleName === 'ADMIN') return '/admin/dashboard';
  if (roleName === 'EMPLOYER') return '/employer-dashboard';
  return '/dashboard';
};

export const getDashboardPathForUser = (user) => getDashboardPathByRole(getRoleName(user));

export const isAdmin = (user) => getRoleName(user) === 'ADMIN';
export const isEmployer = (user) => getRoleName(user) === 'EMPLOYER';
export const isApplicant = (user) => getRoleName(user) === 'APPLICANT';
