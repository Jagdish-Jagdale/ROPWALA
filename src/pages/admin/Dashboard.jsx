import { useMemo, useState, useEffect } from "react";
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
  Sprout
} from "lucide-react";

/* -------------------- Stat Card -------------------- */
function StatCard({ title, value, change, icon, color, iconBg }) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {value}
          </h3>
          <div className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(change)}%
            <span className="text-gray-400 font-normal ml-1">vs last month</span>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${iconBg} ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Activity Item -------------------- */
function ActivityItem({ type, title, time, isPositive = true }) {
  const getIcon = () => {
    switch (type) {
      case "registration": return <UserPlus size={16} />;
      case "subscription": return <CreditCard size={16} />;
      case "listing": return <Sprout size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div className="flex items-start mb-3 pb-3 border-b border-gray-100 last:border-0  last:mb-0 last:pb-0">
      <div
        className={`rounded-full flex items-center justify-center mr-3 border border-gray-100 ${isPositive
          ? "bg-white text-green-600"
          : "bg-white text-yellow-600"
          }`}
        style={{ width: "36px", height: "36px", minWidth: "36px" }}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h6 className="mb-1 text-gray-900 font-semibold text-base">
          {title}
        </h6>
        <p className="text-gray-500 mb-0 text-sm">
          {time} ago
        </p>
      </div>
    </div>
  );
}

/* -------------------- Dashboard -------------------- */
export default function Dashboard() {
  // Subscription Revenue Data
  const revenueData = useMemo(
    () => [
      { month: "Jan", revenue: 15000, newSubs: 45 },
      { month: "Feb", revenue: 18500, newSubs: 52 },
      { month: "Mar", revenue: 22000, newSubs: 58 },
      { month: "Apr", revenue: 26000, newSubs: 65 },
      { month: "May", revenue: 32000, newSubs: 80 },
      { month: "Jun", revenue: 45200, newSubs: 120 },
    ],
    []
  );

  // Subscription Plan Distribution
  const subscriptionPlans = useMemo(
    () => [
      { name: "Gold Plan", value: 45, color: "#f59e0b" },
      { name: "Silver Plan", value: 85, color: "#94a3b8" },
      { name: "Platinum", value: 20, color: "#4f46e5" },
      { name: "Basic", value: 150, color: "#10b981" },
    ],
    []
  );

  const recentActivities = useMemo(
    () => [
      {
        id: 1,
        type: "registration",
        title: "New Nursery 'Green Haven' Registered",
        time: "10 mins",
        isPositive: true,
      },
      {
        id: 2,
        type: "subscription",
        title: "Subscription renewed by 'Flora World'",
        time: "45 mins",
        isPositive: true,
      },
      {
        id: 3,
        type: "listing",
        title: "50+ New crops added by 'Nature's Gift'",
        time: "2 hours",
        isPositive: true,
      },
      {
        id: 4,
        type: "registration",
        title: "New User Registration: John Doe",
        time: "3 hours",
        isPositive: true,
      },
    ],
    []
  );

  // Top Performing Nurseries
  const [stats, setStats] = useState({ nurseries: 0, users: 0, listings: 0 });
  const [realActivities, setRealActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [topNurseries, setTopNurseries] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        const [ownersSnapshot, usersSnapshot, productsSnapshot] = await Promise.all([
          getDocs(collection(db, "owners")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "products")),
        ]);

        const ownersCount = ownersSnapshot.size;
        const usersCount = usersSnapshot.size;
        const productsCount = productsSnapshot.size;

        setStats({
          nurseries: ownersCount,
          users: usersCount,
          listings: productsCount,
        });

        const ownersList = [];
        ownersSnapshot.forEach((doc) => ownersList.push({ id: doc.id, ...doc.data() }));

        const sortedNurseries = [...ownersList]
          .sort((a, b) => (b.rating || Math.random()) - (a.rating || Math.random()))
          .slice(0, 4);

        const mappedTop = sortedNurseries.map((n) => ({
          id: n.id,
          name: n.nurseryName || n.name || "Unknown Nursery",
          sales: n.totalOrders || Math.floor(Math.random() * 1000 + 100),
          revenue: `₹${((n.totalRevenue || (Math.random() * 15 + 2)) * 1).toFixed(1)}L`,
          rating: n.rating || 4.5,
        }));

        setTopNurseries(mappedTop);

        // Try to get some recent activities from owners for display
        const recentOwnersQuery = query(collection(db, "owners"), orderBy("createdAt", "desc"), limit(4));
        const recentOwnersSnapshot = await getDocs(recentOwnersQuery);

        const activities = [];
        recentOwnersSnapshot.forEach((doc) => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            type: "registration",
            title: `New Nursery '${data.nurseryName || data.name || "Unknown"}' Registered`,
            time: data.createdAt?.toDate ? calculateTimeAgo(data.createdAt.toDate()) : "Recently",
            isPositive: true,
          });
        });

        setRealActivities(activities);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  const displayActivities = realActivities.length > 0 ? realActivities : recentActivities;

  return (
    <div className="w-full h-full bg-white py-3 px-4 pt-4 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl mb-2 text-gray-900 font-extrabold">Dashboard</h3>
          <p className="text-m text-gray-600 font-normal mb-0">
            Overview of nursery subscriptions, broker revenue, and platform activity.
          </p>
        </div>
      </div>
      <hr className="mt-4 mb-5 border-gray-10" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Nurseries"
          value={loadingStats ? "..." : stats.nurseries.toLocaleString()}
          change={12.5}
          icon={<Store size={20} />}
          color="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Active Users"
          value={loadingStats ? "..." : stats.users.toLocaleString()}
          change={8.1}
          icon={<Users size={20} />}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Revenue (Subs)"
          value="₹45.2k"
          change={24.3}
          icon={<span className="font-bold text-xl">₹</span>}
          color="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Active Listings"
          value={loadingStats ? "..." : stats.listings.toLocaleString()}
          change={5.4}
          icon={<Sprout size={20} />}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-8">
          <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-6">
              <h5 className="mb-0 font-bold text-gray-900 text-base">
                Subscription Revenue
              </h5>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
                  Monthly
                </button>
                <button className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-green-600 bg-white hover:bg-gray-50">
                  Yearly
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#16a34a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
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
              Subscription Plans
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
                    {item.value} Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Activity */}
        <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-6">
            <h5 className="mb-0 font-bold text-gray-900 text-base">
              Recent System Activity
            </h5>
            <button className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
              View Log
            </button>
          </div>
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                type={activity.type}
                title={activity.title}
                time={activity.time}
                isPositive={activity.isPositive}
              />
            ))}
          </div>
        </div>

        {/* Top Nurseries */}
        <div className="h-full shadow-sm rounded-2xl bg-white border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-6">
            <h5 className="mb-0 font-bold text-gray-900 text-base">
              Top Performing Nurseries
            </h5>
            <button className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 pl-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nursery Name</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Sales</th>
                  <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                  <th className="pb-3 pr-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topNurseries.map((nursery) => (
                  <tr key={nursery.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-600 font-bold mr-3 text-xs">
                          {nursery.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{nursery.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-600 text-sm font-medium">{nursery.sales}</td>
                    <td className="py-3 text-right text-gray-900 text-sm font-bold">{nursery.revenue}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-white border border-gray-100 text-green-700">
                        ★ {nursery.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
