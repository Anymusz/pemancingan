// File: src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/utils/tokenManager";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0) {
    const user = getUser();

    if (!user || !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
