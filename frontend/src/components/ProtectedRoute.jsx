import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathByRole, getRoleName } from "../utils/role";

const ProtectedRoute = ({ children, role, roles, redirectTo = "/login" }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  const currentRole = getRoleName(user);
  const allowedRoles = roles || (role ? [role] : []);

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return <Navigate to={getDashboardPathByRole(currentRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
