import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Store,
  Trees,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Briefcase,
  Sprout,
  Award
} from "lucide-react";

/* -------------------- Stat Cardii -------------------- */
function StatCard({ title, value, icon, color, iconBg, to }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => to && navigate(to)}
      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all group ${to ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-green-600 transition-colors">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mb-0">
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-lg ${iconBg} ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation(["dashboard", "common"]);

  // Subscription Plan Distribution
  const subscriptionPlans = useMemo(
    () => [
      { name: t("dashboard:gold_plan"), value: 45, color: "#f59e0b" },
      { name: t("dashboard:silver_plan"), value: 85, color: "#94a3b8" },
      { name: t("dashboard:platinum"), value: 20, color: "#4f46e5" },
      { name: t("dashboard:basic"), value: 150, color: "#10b981" },
    ],
    [t]
  );

  // Dashboard Lists
  const [stats, setStats] = useState({ nurseries: 0, users: 0, listings: 0, totalRevenue: 0 });
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [recentFranchises, setRecentFranchises] = useState([]);
  const [topProductFranchises, setTopProductFranchises] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        const [ownersSnapshot, usersSnapshot, productsSnapshot] = await Promise.all([
          getDocs(collection(db, "franchise")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "products")),
        ]);

        const ownersCount = ownersSnapshot.size;
        const usersCount = usersSnapshot.size;
        const productsCount = productsSnapshot.size;

        // Calculate Total Revenue
        let totalRevenueSum = 0;
        ownersSnapshot.forEach((doc) => {
          const data = doc.data();
          totalRevenueSum += Number(data.totalRevenue || 0);
        });

        setStats({
          nurseries: ownersCount,
          users: usersCount,
          listings: productsCount,
          totalRevenue: totalRevenueSum,
        });

        // Calculate User Growth Data (Last 6 months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6Months.push({
            month: months[d.getMonth()],
            year: d.getFullYear(),
            count: 0,
            timestamp: d.getTime()
          });
        }

        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();

            const monthIdx = last6Months.findIndex(m => m.month === monthName && m.year === year);
            if (monthIdx !== -1) {
              last6Months[monthIdx].count += 1;
            }
          }
        });

        setUserGrowthData(last6Months);

        // Calculate available years from franchise for filtering
        const years = new Set();
        ownersSnapshot.forEach((doc) => {
          const data = doc.data();
          const date = parseRegistrationDate(data.createdAt || data.applicationDate);
          if (date) {
            years.add(date.getFullYear());
          }
        });
        const yearsList = Array.from(years).sort((a, b) => b - a);
        if (yearsList.length > 0) {
          setAvailableYears(yearsList);
        } else {
          setAvailableYears([new Date().getFullYear()]);
        }

        // Calculate Recent Franchises Added from the existing ownersSnapshot
        const ownersList = ownersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().getTime() : 0
        }));

        const sortedByRecent = [...ownersList]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
          .map(f => {
            const date = parseRegistrationDate(f.createdAt || f.applicationDate);
            return {
              ...f,
              time: date ? calculateTimeAgo(date) : "Recently"
            };
          });

        setRecentFranchises(sortedByRecent);

        // Calculate Top 5 Franchises by Approved Products
        const productCounts = {};
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "approved" || data.status === "active") {
            const owner = data.ownerName || "Unknown Franchise";
            productCounts[owner] = (productCounts[owner] || 0) + 1;
          }
        });

        const sortedFranchises = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopProductFranchises(sortedFranchises);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fullYearData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = months.map(m => ({ month: m, count: 0 }));

    // This would ideally be re-calculated when selectedYear changes
    // Since we are fetching all users in the initial useEffect, we can filter here
    // However, to keep it simple and reactive, I'll update the logic to re-run or rely on a state
    return monthlyData;
  }, [selectedYear]);

  // Robust date parser for franchise registration
  const parseRegistrationDate = (data) => {
    if (!data) return null;

    // Handle Firebase Timestamp
    if (data.toDate) return data.toDate();

    // Handle Numeric Timestamp
    if (typeof data === 'number') return new Date(data);

    // Handle DD-MM-YYYY string format
    if (typeof data === 'string' && data.includes('-')) {
      const parts = data.split(' ')[0].split('-');
      if (parts.length === 3) {
        // parts[0] is day, parts[1] is month, parts[2] is year
        // Month is 0-indexed in JS Date
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }

    // Fallback to standard parsing
    const date = new Date(data);
    return isNaN(date.getTime()) ? null : date;
  };

  // Refined useEffect for dynamic year filtering
  const [filteredGrowthData, setFilteredGrowthData] = useState([]);

  useEffect(() => {
    const calculateGraphData = async () => {
      try {
        const ownersSnapshot = await getDocs(collection(db, "franchise"));
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const yearData = months.map(m => ({ month: m, count: 0 }));

        // Calculate monthly totals (non-cumulative per user preference)
        ownersSnapshot.forEach((doc) => {
          const data = doc.data();
          const date = parseRegistrationDate(data.createdAt || data.applicationDate);

          if (date && date.getFullYear() === selectedYear) {
            const monthName = months[date.getMonth()];
            const monthIdx = yearData.findIndex(m => m.month === monthName);
            if (monthIdx !== -1) {
              yearData[monthIdx].count += 1;
            }
          }
        });

        setFilteredGrowthData(yearData);
      } catch (error) {
        console.error("Error filtering graph data:", error);
      }
    };

    calculateGraphData();
  }, [selectedYear]);

  const calculateTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins";
    return Math.floor(seconds) + " seconds";
  };


  return (
    <div className="w-full h-full bg-white py-3 px-4 pt-4 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl mb-2 text-gray-900 font-extrabold">{t('common:dashboard')}</h3>
          <p className="text-m text-gray-600 font-normal mb-0">
            {t('dashboard:overview_desc')}
          </p>
        </div>
      </div>
      <hr className="mt-4 mb-5 border-gray-10" />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t('dashboard:total_franchises')}
          value={loadingStats ? "..." : stats.nurseries.toLocaleString()}
          icon={<Store size={20} />}
          color="text-green-600"
          iconBg="bg-green-50"
          to="/admin/franchise"
        />
        <StatCard
          title={t('dashboard:total_users')}
          value={loadingStats ? "..." : stats.users.toLocaleString()}
          icon={<Users size={20} />}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
          to="/admin/manageusers"
        />
        <StatCard
          title={t('dashboard:total_products')}
          value={loadingStats ? "..." : stats.listings.toLocaleString()}
          icon={<Sprout size={20} />}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
          to="/admin/products"
        />
        <StatCard
          title={t('dashboard:total_revenue')}
          value={loadingStats ? "..." : `₹${stats.totalRevenue.toLocaleString()}`}
          icon={<span className="font-bold text-xl">₹</span>}
          color="text-green-600"
          iconBg="bg-green-50"
          to="/admin/reports"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-8">
          <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-6">
              <h5 className="mb-0 font-bold text-gray-900 text-base">
                {t('dashboard:growth_overview')}
              </h5>
              <div className="flex gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={filteredGrowthData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFranchise" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    allowDecimals={false}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                      return value;
                    }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, t('dashboard:growth_overview')]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Franchises"
                    stroke="#16a34a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFranchise)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="xl:col-span-4">
          <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
            <h5 className="mb-4 font-bold text-gray-900 text-base">
              {t('dashboard:subscription_plans')}
            </h5>
            <div style={{ width: '100%', height: '250px' }} className="mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subscriptionPlans}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subscriptionPlans.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {subscriptionPlans.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-gray-600 text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">
                    {item.value} {t('dashboard:active')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-0">
        {/* Recent Franchises Added */}
        <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-6">
            <h5 className="mb-0 font-bold text-gray-900 text-base">
              {t('dashboard:recent_franchises')}
            </h5>
          </div>
          <div className="flex flex-col gap-1">
            {recentFranchises.length > 0 ? (
              recentFranchises.map((franchise, idx) => (
                <div key={franchise.id || idx}>
                  <div className="flex items-start gap-4 p-1">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full border border-green-50 bg-green-50/30 flex items-center justify-center">
                        <UserPlus size={20} className="text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className="text-[15px] font-semibold text-gray-900 mb-0.5 leading-snug">
                        {t('dashboard:new_franchise_reg', { name: franchise.nurseryName || franchise.name || franchise.userName || "Unknown" })}
                      </h6>
                      <p className="text-sm text-gray-500 font-medium lowercase first-letter:uppercase">
                        {franchise.time}
                      </p>
                    </div>
                  </div>
                  {idx < recentFranchises.length - 1 && (
                    <hr className="my-1 border-gray-100/50" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">{t('dashboard:no_franchises')}</div>
            )}
          </div>
        </div>

        {/* Top Product Franchises */}
        <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-6">
            <h5 className="mb-0 font-bold text-gray-900 text-base">
              {t('dashboard:most_products')}
            </h5>
          </div>
          <div className="flex flex-col gap-1">
            {topProductFranchises.length > 0 ? (
              topProductFranchises.map((franchise, idx) => (
                <div key={`top-${idx}`}>
                  <div className="flex items-start gap-4 p-1">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full border border-green-50 bg-green-50/30 flex items-center justify-center">
                        <Award size={20} className="text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h6 className="text-[15px] font-semibold text-gray-900 mb-0.5 leading-snug">
                        {t('dashboard:approved_products', { count: franchise.count, name: franchise.name })}
                      </h6>
                      <p className="text-sm text-gray-500 font-medium">
                        {t('dashboard:top_franchise', { index: idx + 1 })}
                      </p>
                    </div>
                  </div>
                  {idx < topProductFranchises.length - 1 && (
                    <hr className="my-1 border-gray-100/50" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">No franchise data found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
