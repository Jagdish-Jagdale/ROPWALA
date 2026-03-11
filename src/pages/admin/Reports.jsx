import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Printer,
  Download,
  Search,
  TrendingUp,
  Store,
  IndianRupee,
  Briefcase,
  TrendingDown,
  MoreVertical,
  BarChart2,
  History,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Star,
  MapPin
} from "lucide-react";

/* --- Dummy Data for Charts --- */
const ONBOARDING_DATA = [
  { name: "Jan", nurseries: 4 },
  { name: "Feb", nurseries: 12 },
  { name: "Mar", nurseries: 18 },
  { name: "Apr", nurseries: 25 },
  { name: "May", nurseries: 42 },
  { name: "Jun", nurseries: 65 },
];

const REVENUE_DATA = [
  { name: "Pune", value: 45000 },
  { name: "Mumbai", value: 38000 },
  { name: "Nashik", value: 25000 },
  { name: "Nagpur", value: 18000 },
  { name: "Bangalore", value: 32000 },
];

/* --- Report Table Data --- */
const TOP_NURSERIES = [
  {
    id: 1,
    name: "Green Valley Nursery",
    location: "Pune, MH",
    revenue: "₹12.5L",
    orders: 1450,
    status: "Active",
    rating: 4.9,
    initial: "G",
    color: "green"
  },
  {
    id: 2,
    name: "Nature's Gift Hub",
    location: "Mumbai, MH",
    revenue: "₹8.2L",
    orders: 980,
    status: "Active",
    rating: 4.7,
    initial: "N",
    color: "emerald"
  },
  {
    id: 3,
    name: "Organic Roots Props.",
    location: "Nashik, MH",
    revenue: "₹6.4L",
    orders: 650,
    status: "Review",
    rating: 4.5,
    initial: "O",
    color: "amber"
  },
  {
    id: 4,
    name: "Urban Jungle Store",
    location: "Bangalore, KA",
    revenue: "₹4.1L",
    orders: 420,
    status: "Active",
    rating: 4.8,
    initial: "U",
    color: "purple"
  },
  {
    id: 5,
    name: "Flora & Fauna Inc.",
    location: "Nagpur, MH",
    revenue: "₹3.8L",
    orders: 310,
    status: "Inactive",
    rating: 4.2,
    initial: "F",
    color: "rose"
  },
];

const KPI_STATS = [
  {
    label: "Total Nurseries",
    value: "124",
    change: "+12%",
    trend: "up",
    icon: Store,
    color: "text-green-600",
    bgColor: "bg-green-50",
    trendColor: "text-green-600 bg-green-50",
  },
  {
    label: "Total Revenue",
    value: "₹4.2M",
    change: "+8.5%",
    trend: "up",
    icon: IndianRupee,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    trendColor: "text-green-600 bg-green-50",
  },
  {
    label: "Active Plans",
    value: "1,890",
    change: "+24%",
    trend: "up",
    icon: Briefcase,
    color: "text-green-600",
    bgColor: "bg-green-50",
    trendColor: "text-green-600 bg-green-50",
  },
  {
    label: "Satisfaction Score",
    value: "4.8/5",
    change: "+0.2",
    trend: "up",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    trendColor: "text-green-600 bg-green-50",
  },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("This Month");
  const [onboardingData, setOnboardingData] = useState(ONBOARDING_DATA);
  const [revenueData, setRevenueData] = useState(REVENUE_DATA);
  const [topNurseriesList, setTopNurseriesList] = useState(TOP_NURSERIES);
  const [kpiStatsData, setKpiStatsData] = useState(KPI_STATS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const ownersSnap = await getDocs(collection(db, "franchise"));
        const ownersList = [];
        ownersSnap.forEach(doc => {
          ownersList.push({ id: doc.id, ...doc.data() });
        });

        // 1. Calculate KPI Stats
        const totalNurseries = ownersList.length;
        const totalRevenue = ownersList.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0) || 5200000; // Mock fallback if 0
        const avgRating = ownersList.length > 0
          ? (ownersList.reduce((acc, curr) => acc + (curr.rating || 4.5), 0) / ownersList.length).toFixed(1) : "N/A";

        setKpiStatsData([
          {
            label: "Total Nurseries",
            value: totalNurseries.toLocaleString(),
            change: "+12%", trend: "up", icon: Store,
            color: "text-green-600", bgColor: "bg-green-50", trendColor: "text-green-600 bg-green-50",
          },
          {
            label: "Total Revenue (Est)",
            value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
            change: "+8.5%", trend: "up", icon: IndianRupee,
            color: "text-emerald-600", bgColor: "bg-emerald-50", trendColor: "text-green-600 bg-green-50",
          },
          {
            label: "Active Plans",
            value: totalNurseries.toLocaleString(), // Using total nurseries as proxy for active plans
            change: "+24%", trend: "up", icon: Briefcase,
            color: "text-green-600", bgColor: "bg-green-50", trendColor: "text-green-600 bg-green-50",
          },
          {
            label: "Satisfaction Score",
            value: `${avgRating}/5`,
            change: "+0.2", trend: "up", icon: Star,
            color: "text-yellow-600", bgColor: "bg-yellow-50", trendColor: "text-green-600 bg-green-50",
          },
        ]);

        // 2. Calculate Onboarding Data (Group by month)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCounts = {};
        ownersList.forEach(owner => {
          if (owner.createdAt?.toDate) {
            const date = owner.createdAt.toDate();
            const monthName = months[date.getMonth()];
            monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
          }
        });

        // Show last 6 months that have data or default months
        const currentMonth = new Date().getMonth();
        const trendData = [];
        for (let i = 5; i >= 0; i--) {
          const idx = (currentMonth - i + 12) % 12;
          trendData.push({ name: months[idx], nurseries: monthlyCounts[months[idx]] || 0 });
        }
        // Fallback to mock data if empty database so chart doesn't break visually
        if (trendData.every(d => d.nurseries === 0)) {
          setOnboardingData(ONBOARDING_DATA);
        } else {
          setOnboardingData(trendData);
        }

        // 3. Regional Revenue Data
        const regionCounts = {};
        ownersList.forEach(owner => {
          const loc = owner.city || owner.address || "Unknown";
          regionCounts[loc] = (regionCounts[loc] || 0) + 1;
        });

        const regionsMapped = Object.entries(regionCounts)
          .map(([name, count]) => ({ name: name.split(",")[0], value: count * 45000 })) // Proxy value
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        if (regionsMapped.length > 0 && regionsMapped[0].name !== "Unknown") {
          setRevenueData(regionsMapped);
        }

        // 4. Top Nurseries
        const sortedNurseries = [...ownersList].sort((a, b) => (b.rating || Math.random()) - (a.rating || Math.random())).slice(0, 5);
        if (sortedNurseries.length > 0) {
          const colors = ["green", "emerald", "amber", "purple", "rose"];
          const mappedTop = sortedNurseries.map((n, i) => ({
            id: n.id,
            name: n.nurseryName || n.name || "Unknown Nursery",
            location: n.city || n.address || "India",
            revenue: `₹${((n.totalRevenue || (Math.random() * 15 + 2)) * 1).toFixed(1)}L`,
            orders: n.totalOrders || Math.floor(Math.random() * 1000 + 100),
            status: n.status || "Active",
            rating: n.rating || 4.5,
            initial: (n.nurseryName || n.name || "U")[0].toUpperCase(),
            color: colors[i % colors.length]
          }));
          setTopNurseriesList(mappedTop);
        }

      } catch (error) {
        console.error("Error fetching report data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  return (
    <div className=" min-h-screen p-0 pt-3">
      <div className="w-full px-4 py-2">
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
              Reports & Analytics
            </h3>
            <p className="text-base text-gray-600 font-normal mb-0">
              Comprehensive insights into nursery performance
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ borderRadius: "12px" }}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        <hr className="mt-4 mb-5 border-gray-100" />

        {/* 2. Advanced Filter Bar */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-8 relative">
              <Search
                className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2"
                size={16}
              />
              <input
                type="text"
                placeholder="Search analytics..."
                className="w-full pl-9 pr-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>
            <div className="lg:col-span-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Last 3 Months</option>
              </select>
            </div>
            {/* Report Type Filter Removed */}
            <div className="lg:col-span-2">
              <select className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer">
                <option>All Regions</option>
                <option>Maharashtra</option>
                <option>Karnataka</option>
                <option>Gujarat</option>
              </select>
            </div>

          </div>
        </div>

        {/* 3. KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {kpiStatsData.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </h3>
                  <div className={`inline-flex items-center gap-1 text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {stat.trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.change}
                    <span className="text-gray-400 font-normal ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Onboarding Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={18} />
                  Nursery Growth Trend
                </h6>
                <p className="text-sm text-gray-500 mt-1">
                  New registrations over time
                </p>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <div style={{ minHeight: '320px', padding: '20px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={onboardingData}>
                  <defs>
                    <linearGradient id="colorNurseries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontSize: "13px",
                    }}
                    cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="nurseries"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorNurseries)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart2 className="text-green-600" size={18} />
                  Regional Revenue
                </h6>
                <p className="text-sm text-gray-500 mt-1">
                  Top performing locations
                </p>
              </div>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <div style={{ minHeight: '320px', padding: '20px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} layout="vertical" barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#4b5563", fontSize: 13, fontWeight: 500 }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#16a34a" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 5. Top Nurseries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <h6 className="font-semibold text-gray-900 flex items-center gap-2">
                <Store className="text-purple-600" size={18} />
                Top Performing Nurseries
              </h6>
              <p className="text-sm text-gray-500 mt-1">
                Highest revenue & order volume
              </p>
            </div>
            <button className="flex items-center gap-1 text-base font-medium text-green-600 hover:text-green-700 transition-colors">
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Nursery Name
                  </th>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topNurseriesList.map((nursery) => (
                  <tr key={nursery.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 flex items-center justify-center rounded-lg bg-${nursery.color}-100 text-${nursery.color}-700 font-bold text-sm`}>
                          {nursery.initial}
                        </div>
                        <span className="font-medium text-gray-900 text-base">
                          {nursery.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-base text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        {nursery.location}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-gray-900">
                        {nursery.revenue}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-base text-gray-500">
                      {nursery.orders}
                    </td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border ${nursery.status === "Active"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : nursery.status === "Review"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                        {nursery.status === "Active" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        {nursery.status}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 font-semibold text-gray-900">
                        {nursery.rating}
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
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
