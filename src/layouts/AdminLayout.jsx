import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutGrid,
  Users,
  FileText,
  Shield,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Package,
  Store,
  LayoutPanelTop,
  Languages,
  Globe,
} from "lucide-react";

/* ---------- Nav Item ---------- */
const NavItem = ({
  to,
  icon: Icon,
  label,
  end,
  collapsed,
  hasDropdown,
  submenu,
  isDropdownOpen,
  onToggleDropdown,
  onItemClick,
}) => {
  const location = useLocation();

  // Check if any child route is activeyy
  const isAnyChildActive = hasDropdown && submenu?.some(item =>
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  );
  if (hasDropdown) {
    // Shared active check for both collapsed and expanded states
    const isActive = isAnyChildActive;

    if (!collapsed) {
      return (
        <div className={isDropdownOpen ? "" : "mb-2"}>
          <div
            onClick={onToggleDropdown}
            className={`flex items-center rounded-lg px-4 py-2 gap-3 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${isDropdownOpen || isActive
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-sm"
              : "text-black hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm"
              }`}
          >
            <Icon
              size={20}
              strokeWidth={2}
              className={isDropdownOpen || isActive ? "text-green-700" : "text-black"}
            />
            <span className="flex-grow text-[16px] font-medium whitespace-nowrap">{label}</span>
            {isDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? "max-h-40 opacity-100 mt-1 mb-1" : "max-h-0 opacity-0"
              }`}
          >
            <div className="flex flex-col gap-1.5">
              {submenu.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  className={({ isActive: isSubActive }) =>
                    `flex items-center px-5 py-2 ml-4 rounded-md text-[16px] font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] no-underline ${isSubActive
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                      : "text-black hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm"
                    }`
                  }
                  style={{ textDecoration: 'none' }}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Collapsed Dropdown State
    return (
      <div
        onClick={onToggleDropdown}
        title={label}
        className={`flex items-center justify-center rounded-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] mb-1 cursor-pointer px-2 py-2 ${isActive
          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
          : "text-black hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm"
          }`}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          className={isActive ? "text-white" : "text-black"}
        />
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onItemClick}
      title={collapsed ? label : ""}
      className={({ isActive }) => {
        const base =
          "flex items-center rounded-md transition-all duration-300 ease-in-out transform hover:scale-[1.02] mb-1 no-underline";
        const spacing = collapsed
          ? "justify-center px-2 py-2"
          : "px-4 py-2 gap-3";
        const activeStyle = isActive
          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
          : "text-black hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm";

        return `${base} ${spacing} ${activeStyle}`;
      }}
      style={{ textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={20}
            strokeWidth={isActive ? 2.5 : 2}
            className={isActive ? "text-white" : "text-black"}
          />
          {!collapsed && <span className="text-[16px] font-medium">{label}</span>}
        </>
      )}
    </NavLink>
  );
};

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('common');

  const language = i18n.language.toUpperCase();

  const menuItems = [
    {
      to: "/admin/dashboard",
      label: t('dashboard'),
      icon: LayoutGrid,
      end: true,
    },
    {
      to: "/admin/products",
      label: t('products'),
      icon: Package,
    },
    {
      to: "/admin/ourproducts",
      label: t('our_product'),
      icon: Package,
    },
    {
      to: "/admin/orders",
      label: t('orders'),
      icon: FileText,
    },
    {
      to: "/admin/manageusers",
      label: t('users'),
      icon: Users,
    },
    {
      to: "/admin/franchise",
      label: t('franchise'),
      icon: Store,
    },
    {
      to: "/admin/banners",
      label: t('banner'),
      icon: LayoutPanelTop,
    },
    { to: "/admin/reports", label: t('reports'), icon: FileText },
    {
      label: t('settings'),
      icon: Settings,
      hasDropdown: true,
      submenu: [
        { to: "/admin/categories", label: t('categories') },
        { to: "/admin/owner-hamipatra", label: t('owner_hamipatra') },
        { to: "/admin/user-hamipatra", label: t('user_hamipatra') },
      ],
    },
  ];

  // State for desktop sidebar collapse
  const [collapsed, setCollapsed] = useState(false);
  // State for mobile sidebar open/close
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // State for dropdowns
  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  // Scroll reset for main content on route change
  const mainContentRef = useRef(null);

  // Close mobile menu on route change and reset scroll
  useEffect(() => {
    setMobileMenuOpen(false);
    // Auto-close dropdown when route changes
    setOpenDropdownKey(null);

    // Reset scroll to top
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleToggleDropdown = (key) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenDropdownKey(key);
    } else {
      setOpenDropdownKey(openDropdownKey === key ? null : key);
    }
  };

  const handleItemClick = () => {
    // If on mobile, close menu when item is clicked
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="h-screen bg-white font-sans text-gray-900 flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm flex-shrink-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <img src="/RopWala.png" className="w-10 h-10 object-contain rounded-full shadow-sm" alt="Logo" />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen lg:h-auto bg-white shadow-lg lg:shadow-xl z-50 flex flex-col
          transition-all duration-300 ease-in-out transform
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[70px]" : "lg:w-[275px] w-[280px]"}
          lg:m-4 lg:rounded-2xl lg:border lg:border-gray-200/60 lg:flex-shrink-0`}
      >
        {/* Sidebar Header (Hidden on Mobile as we have TopBar, visible on Desktop) */}
        <div
          className={`hidden lg:flex items-center justify-center border-b border-gray-200/100 relative transition-all duration-300 lg:rounded-t-2xl ${collapsed ? "min-h-[80px]" : "min-h-[100px]"
            }`}
        >
          {!collapsed && (
            <div className="flex flex-col items-center gap-3 w-full px-4 py-3">
              <div className="w-24 h-24 flex items-center justify-center transition-transform hover:scale-105 rounded-full overflow-hidden">
                <img
                  src="/RopWala.png"
                  className="w-full h-full object-contain"
                  alt="Logo"
                />
              </div>
              <div className="flex flex-col items-center">

                <span className="mt-1 px-3 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded-full uppercase tracking-wider shadow-sm">
                  {t('admin')}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-green-600 transition-all duration-200 hidden lg:flex items-center justify-center ${collapsed
              ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 hover:scale-105"
              : "absolute top-3 right-3"
              }`}
          >
            {collapsed ? <ChevronsRight size={24} strokeWidth={3} className="text-green-600" /> : <ChevronsLeft size={20} strokeWidth={3} />}
          </button>
        </div>

        {/* Mobile Sidebar Header (Brand inside the sidebar for mobile only) */}
        <div className="lg:hidden p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <img
                src="/RopWala.png"
                className="w-14 h-14 object-contain"
                alt="Logo"
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-gray-900 text-lg leading-tight">
                ROPWALA
              </span>
              <span className="mt-1 px-2.5 py-0.5 text-xs font-bold bg-green-600 text-white rounded uppercase tracking-wide">
                {t('admin')}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavItem
                key={item.to || item.label}
                {...item}
                collapsed={window.innerWidth >= 1024 ? collapsed : false}
                isDropdownOpen={openDropdownKey === (item.to || item.label)}
                onToggleDropdown={() => handleToggleDropdown(item.to || item.label)}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-gray-100 p-2 flex flex-col gap-1">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "mr" : "en")}
            className={`w-full flex items-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors ${collapsed ? "justify-center p-2" : "px-3 py-2 gap-2"
              }`}
            title={i18n.language === "en" ? t('marathi') : t('english')}
          >
            <Languages size={20} className="font-bold shrink-0" />
            {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
              <span className="text-sm font-bold truncate">{t('language')} ({language})</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-red-500 hover:bg-red-50 transition-colors ${collapsed ? "justify-center p-2" : "px-3 py-2 gap-2"
              }`}
            title={t('logout')}
          >
            <LogOut size={20} className="font-bold shrink-0" />
            {(!collapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
              <span className="text-sm font-bold truncate">{t('logout')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out lg:pr-4 lg:py-4 h-full overflow-hidden">
        <div
          ref={mainContentRef}
          className="h-full w-full overflow-y-auto no-scrollbar rounded-2xl scroll-smooth"
        >
          <Outlet />
        </div>
      </main>
    </div >
  );
}
