import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Protected from "./components/Protected";
import AdminLayout from "./layouts/AdminLayout";
import Login from "./pages/auth/Login";
import RoleRedirect from "./components/RoleRedirect";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminReports from "./pages/admin/Reports";
import AdminProducts from "./pages/admin/Products";
import AdminOurProducts from "./pages/admin/OurProducts";
import AdminFranchise from "./pages/admin/Franchise";
import AdminSettings from "./pages/admin/Settings";
import AdminCategories from "./pages/admin/Categories";
import AdminOwnerHamipatra from "./pages/admin/OwnerHamipatra";
import AdminUserHamipatra from "./pages/admin/UserHamipatra";
import AdminBanner from "./pages/admin/Banner";
import { ROLES } from "./utils/roles";

import ScrollToTop from "./components/ScrollToTop";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import NoInternet from "./components/NoInternet";

function App() {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <NoInternet />;
  }

  return (
    <div className="App">
      <ScrollToTop />
      <Toaster position="top-right" />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* ADMIN (formerly SuperAdmin) */}
        <Route element={<Protected roles={[ROLES.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/manageusers"
              element={<ManageUsers />}
            />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/ourproducts" element={<AdminOurProducts />} />
            <Route path="/admin/franchise" element={<AdminFranchise />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route
              path="/admin/settings"
              element={<AdminSettings />}
            />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/owner-hamipatra" element={<AdminOwnerHamipatra />} />
            <Route path="/admin/user-hamipatra" element={<AdminUserHamipatra />} />
            <Route path="/admin/banners" element={<AdminBanner />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
