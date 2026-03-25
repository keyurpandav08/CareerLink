export const getRoleName = (user) => user?.roleName || user?.role?.name || null;

export const getDashboardPathByRole = (roleName) => (
  roleName === 'EMPLOYER' ? '/employer-dashboard' : '/dashboard'
);

export const getDashboardPathForUser = (user) => getDashboardPathByRole(getRoleName(user));

export const isEmployer = (user) => getRoleName(user) === 'EMPLOYER';
export const isApplicant = (user) => getRoleName(user) === 'APPLICANT';
