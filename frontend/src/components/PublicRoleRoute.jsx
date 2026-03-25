import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';

const PublicRoleRoute = ({ children, allowGuests = true, allowedRoles = [], guestOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return allowGuests ? children : <Navigate to="/login" replace />;
  }

  if (guestOnly) {
    return <Navigate to={getDashboardPathForUser(user)} replace />;
  }

  if (allowedRoles.length === 0) {
    return children;
  }

  const role = getRoleName(user);
  if (allowedRoles.includes(role)) {
    return children;
  }

  return <Navigate to={getDashboardPathForUser(user)} replace />;
};

export default PublicRoleRoute;
