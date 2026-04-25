import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    collection,
    getDocs,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import {
    FileText,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    MoreVertical,
    Calendar,
    User,
    Package,
    ShoppingCart
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

export default function AdminOrders() {
    const { t } = useTranslation(['orders', 'common']);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "franchise_orders"), orderBy("orderDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setOrders(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            // Fallback for case where index doesn't exist yet for orderDate
            const fallbackQ = query(collection(db, "franchise_orders"));
            onSnapshot(fallbackQ, (fallbackSnap) => {
                const data = fallbackSnap.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setOrders(data);
                setLoading(false);
            });
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        try {
            setIsDeleting(true);
            await deleteDoc(doc(db, "franchise_orders", orderToDelete.id));
            toast.success("Order deleted successfully");
            setShowDeleteModal(false);
            setOrderToDelete(null);
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setIsDeleting(false);
        }
    };

    const updateOrderStatus = async (id, newStatus) => {
        try {
            const orderRef = doc(db, "franchise_orders", id);
            await updateDoc(orderRef, { status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        }
    };

    const filteredOrders = orders.filter((order) => {
        const searchLower = search.toLowerCase();
        const customerName = (order.customerName || order.deliveryName || "").toLowerCase();
        const deliveryPhone = (order.deliveryPhone || "").toLowerCase();
        const orderId = (order.orderId || order.id || "").toLowerCase();
        const items = (order.items || "").toLowerCase();

        const matchesSearch = 
            customerName.includes(searchLower) ||
            deliveryPhone.includes(searchLower) ||
            orderId.includes(searchLower) ||
            items.includes(searchLower);
        
        const matchesStatus = statusFilter === "all" || (order.status || "pending").toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

    const calculateTotalQuantity = (itemsString) => {
        if (!itemsString || typeof itemsString !== 'string') return 0;
        // Match patterns like 'x1', 'x 1', 'x10' etc.
        const matches = itemsString.match(/x\s*(\d+)/g);
        if (!matches) return 1; // Default to 1 if no 'xN' found but items exist
        return matches.reduce((total, match) => {
            const num = parseInt(match.replace(/[^\d]/g, ''));
            return total + (isNaN(num) ? 0 : num);
        }, 0);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "completed":
            case "delivered": return "bg-green-100 text-green-700 border-green-200";
            case "pending":
            case "placed": return "bg-gray-100 text-gray-700 border-gray-200";
            case "cancelled": return "bg-red-100 text-red-700 border-red-200";
            case "processing": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        if (typeof date === 'string') return date; // Already a string in DB
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold capitalize">
                            {t('common:orders')}
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            Manage and track all orders from your franchises
                        </p>
                    </div>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Orders"
                        value={orders.length}
                        icon={<ShoppingCart size={20} />}
                        color="text-blue-600"
                        iconBg="bg-blue-50"
                    />
                    <StatCard
                        title="Pending"
                        value={orders.filter(o => (o.status || 'pending').toLowerCase() === 'pending' || (o.status || '').toLowerCase() === 'placed').length}
                        icon={<Clock size={20} />}
                        color="text-gray-600"
                        iconBg="bg-gray-50"
                    />
                    <StatCard
                        title="Completed"
                        value={orders.filter(o => o.status?.toLowerCase() === 'completed' || o.status?.toLowerCase() === 'delivered').length}
                        icon={<CheckCircle size={20} />}
                        color="text-green-600"
                        iconBg="bg-green-50"
                    />
                    <StatCard
                        title="Cancelled"
                        value={orders.filter(o => o.status?.toLowerCase() === 'cancelled').length}
                        icon={<X size={20} />}
                        color="text-red-600"
                        iconBg="bg-red-50"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-bold text-gray-900">{t('common:search_filters')}</h5>
                        <div className="text-sm font-medium text-gray-500">
                            {t('common:total_records', { count: filteredOrders.length })}
                        </div>
                    </div>
                    <hr className="mt-0 mb-4 border-gray-200" />
                    <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
                        <div className="w-full flex flex-col gap-1.5 xl:flex-1">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Search Orders</label>
                            <div className="relative group">
                                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={18} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by User, Item or ID..."
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-gray-700 bg-gray-50/30"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:w-[200px]">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Status</label>
                            <div className="relative group">
                                <Filter className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="placed">Placed</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        {t('common:sr_no')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        Order Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        Items
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        User Details
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        Quantity
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                        {t('common:action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">Loading orders...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedOrders.length > 0 ? (
                                    paginatedOrders.map((order, index) => (
                                         <tr key={order.id} className="hover:bg-green-50/50 transition-colors border-b border-gray-100 last:border-0">
                                             <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                                                 {String(startIndex + index + 1).padStart(2, "0")}
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                     <Calendar size={14} className="text-gray-400" />
                                                     {formatDate(order.orderDate)}
                                                 </div>
                                             </td>
                                             <td className="px-6 py-4">
                                                 <div className="text-sm text-gray-900 font-medium line-clamp-1 max-w-xs" title={order.items}>
                                                     {order.items || "N/A"}
                                                 </div>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex flex-col">
                                                     <span className="text-sm font-bold text-gray-900">{order.customerName || order.deliveryName || "Unknown Customer"}</span>
                                                     <span className="text-xs text-gray-500 font-medium">{order.deliveryPhone || "No Phone"}</span>
                                                 </div>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                                 <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                                                     {calculateTotalQuantity(order.items)}
                                                 </span>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                                 <select
                                                     value={(order.status || "pending").toLowerCase()}
                                                     onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                     className={`px-3 py-1.5 text-sm font-medium border rounded-lg outline-none cursor-pointer transition-all focus:ring-2 focus:ring-green-500/20 tracking-wider ${getStatusColor(order.status || "pending")}`}
                                                 >
                                                     <option value="pending">Pending</option>
                                                     <option value="placed">Placed</option>
                                                     <option value="processing">Processing</option>
                                                     <option value="completed">Completed</option>
                                                     <option value="cancelled">Cancelled</option>
                                                 </select>
                                             </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-center">
                                                 <div className="flex items-center justify-center gap-2">
                                                     <button 
                                                         className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                         title="Edit Status"
                                                         onClick={() => {
                                                             const newStatus = prompt("Enter new status (pending, processing, completed, cancelled):", order.status || "pending");
                                                             if (newStatus) updateOrderStatus(order.id, newStatus.toLowerCase());
                                                         }}
                                                     >
                                                         <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Order"
                                                        onClick={() => {
                                                            setOrderToDelete(order);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <FileText size={48} className="opacity-20" />
                                                <p className="text-sm font-medium">No orders found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-bold text-gray-600">
                                {t('common:pagination', { current: currentPage, total: Math.max(1, totalPages) })}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteOrder}
                title="Delete Order"
                message={`Are you sure you want to delete this order from ${orderToDelete?.customerName || orderToDelete?.deliveryName}? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
}
