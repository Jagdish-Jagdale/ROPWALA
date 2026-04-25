import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { hasAnyRole } from "../utils/roles";
import Loader from "./Loader";

export default function Protected({ roles }) {
  const { user, role, loading } = useAuth() || {};
  const location = useLocation();

  // Check if auth context is available
  if (!user && loading === undefined) {
    console.error("Protected component must be used within AuthProvider");
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return <Loader />;

  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !hasAnyRole(role, roles)) return <Navigate to="/" replace />;

  return <Outlet />;
}
