import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    addDoc,
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
    Package,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Upload,
    CheckCircle,
    Clock,
    AlertCircle,
    Image as ImageIcon,
    MoreVertical,
    TrendingUp,
    BarChart3,
    Box,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "Plants",
        price: "",
        stock: "",
        description: "",
        status: "pending",
        imageUrl: "",
        ownerName: "Admin",
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "products"), productData);
            toast.success("Product added successfully");
            setIsAddModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            toast.error("Failed to add product");
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const productRef = doc(db, "products", selectedProduct.id);
            await updateDoc(productRef, {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                updatedAt: serverTimestamp(),
            });
            toast.success("Product updated successfully");
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            resetForm();
            fetchProducts();
        } catch (error) {
            toast.error("Failed to update product");
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteDoc(doc(db, "products", id));
                toast.success("Product deleted");
                fetchProducts();
            } catch (error) {
                toast.error("Failed to delete product");
            }
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            toast.success(`Product marked as ${newStatus}`);
            fetchProducts();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            category: "Plants",
            price: "",
            stock: "",
            description: "",
            status: "pending",
            imageUrl: "",
            ownerName: "Admin",
        });
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            stock: product.stock.toString(),
            description: product.description,
            status: product.status,
            imageUrl: product.imageUrl || "",
            ownerName: product.ownerName || "Admin",
        });
        setIsEditModalOpen(true);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Filter and Pagination logic
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            Manage Inventory
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            View and manage your product catalog
                        </p>
                    </div>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary (Mini) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total products"
                        value={products.length}
                        icon={Box}
                        variant="gray"
                    />
                    <StatCard
                        title="Approved"
                        value={products.filter(p => p.status === 'approved' || p.status === 'active').length}
                        icon={CheckCircle}
                        variant="green"
                    />
                    <StatCard
                        title="Pending"
                        value={products.filter(p => p.status === 'pending').length}
                        icon={Clock}
                        variant="blue"
                    />
                    <StatCard
                        title="Rejected"
                        value={products.filter(p => p.status === 'rejected').length}
                        icon={AlertCircle}
                        variant="red"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-xs font-semibold text-gray-900">Search & Filters</h5>
                    </div>
                    <hr className="mt-0 mb-4 border-gray-200" />
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-5 relative">
                            <Search
                                className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2"
                                size={18}
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by product name, category, or description..."
                                className="w-full pl-10 pr-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                            />
                        </div>

                        <div className="md:col-span-3 relative">
                            <Filter className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" size={16} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none cursor-pointer bg-white"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>

                        <div className="md:col-span-4 flex justify-end items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Rows:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-1.5"
                                >
                                    {[5, 10, 25, 50].map((pageSize) => (
                                        <option key={pageSize} value={pageSize}>
                                            {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm text-gray-700 whitespace-nowrap">
                                    Page {currentPage} of {Math.max(1, totalPages)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                                        Sr No
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Product Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Owner / Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    Loading inventory...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedProducts.length ? (
                                    paginatedProducts.map((product, index) => (
                                        <tr
                                            key={product.id}
                                            style={{ borderBottom: '1px solid #dae2eeff' }}
                                            className="bg-white transition-colors hover:!bg-green-50/50"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {String(startIndex + index + 1).padStart(2, "0")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                                                        {product.imageUrl ? (
                                                            <img
                                                                src={product.imageUrl}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://placehold.co/100x100?text=No+Image";
                                                                }}
                                                            />
                                                        ) : (
                                                            <Package size={20} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        SKU: {product.sku || product.id.slice(0, 8).toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-700 border border-green-100">
                                                        {(product.ownerName || "A")[0]}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {product.ownerName || "Admin"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    {product.category}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                ₹{product.price.toLocaleString("en-IN")}
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${product.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {product.stock} Units
                                                    </span>
                                                    {product.stock < 10 && (
                                                        <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-tighter animate-pulse">
                                                            Low Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${product.status === "approved" || product.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                                                    product.status === "pending" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                        "bg-red-50 text-red-700 border-red-200"
                                                    }`}>
                                                    {product.status || "pending"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Accept Button */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, "approved")}
                                                        className={`p-1.5 rounded-full transition-colors border ${product.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 'text-green-600 hover:text-green-800 hover:bg-green-50 border-green-100'}`}
                                                        title="Accept / Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>

                                                    {/* Hold Button */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, "pending")}
                                                        className={`p-1.5 rounded-full transition-colors border ${product.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-amber-100'}`}
                                                        title="Put on Hold"
                                                    >
                                                        <Clock size={18} />
                                                    </button>

                                                    {/* Cancel Button */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, "rejected")}
                                                        className={`p-1.5 rounded-full transition-colors border ${product.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'text-red-600 hover:text-red-800 hover:bg-red-50 border-red-100'}`}
                                                        title="Cancel / Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>

                                                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>

                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                                    <Package size={32} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-medium">
                                                    No products found in your inventory.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                            setIsAddModalOpen(false);
                            setIsEditModalOpen(false);
                            resetForm();
                        }}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package className="text-green-600" size={24} />
                                {isAddModalOpen ? "Add New Product" : "Edit Product"}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setIsEditModalOpen(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={isAddModalOpen ? handleAddProduct : handleUpdateProduct}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Arabian Jasmine Plant"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="Plants">Plants</option>
                                            <option value="Seeds">Seeds</option>
                                            <option value="Pots">Pots</option>
                                            <option value="Tools">Tools</option>
                                            <option value="Fertilizers">Fertilizers</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                            placeholder="Admin or Nursery Name"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Available</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            placeholder="0"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Image URL</label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter product description..."
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    {isAddModalOpen ? "Save Product" : "Update Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
