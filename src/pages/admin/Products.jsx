import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    collection,
    getDocs,
    addDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "../../lib/firebase";
import { ref, deleteObject } from "firebase/storage";
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
import ProductViewModal from "../../components/ProductViewModal";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

const ProductImage = ({ src, alt, className = "", priority = false }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className={`relative overflow-hidden bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center ${className}`}>
            {isLoading && !error && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <ImageIcon size={18} className="text-gray-300" />
                </div>
            )}

            {src && !error ? (
                <img
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    fetchPriority={priority ? "high" : "low"}
                    decoding="async"
                    className={`w-full h-full object-cover transition-all duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setError(true);
                    }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                    <Package size={20} className="text-gray-300" />
                </div>
            )}
        </div>
    );
};

export default function AdminProducts() {
    const { t } = useTranslation(['product', 'common']);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [nurseryFilter, setNurseryFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [nurseries, setNurseries] = useState([]); // Store franchise/nursery data

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: "Plants",
        price: "",
        stock: "",
        description: "",
        status: "pending",
        imageUrl: "",
        ownerName: "Admin",
        nurseryName: "",
    });

    useEffect(() => {
        fetchProducts();
        
        // Use onSnapshot for real-time nursery data
        const unsubscribeNurseries = onSnapshot(
            collection(db, "franchise"),
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setNurseries(data);
            },
            (error) => {
                console.error("Error fetching nurseries:", error);
            }
        );

        return () => unsubscribeNurseries();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));

            // Inject <link rel="preload"> into <head> for first 10 images.
            // This gives them the HIGHEST browser network priority — same as
            // stylesheets — and starts downloading before any JS Image() objects.
            const existingPreloads = document.querySelectorAll('link[data-product-preload]');
            existingPreloads.forEach(el => el.remove());

            data.slice(0, 10).forEach(product => {
                if (product.imageUrl) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = product.imageUrl;
                    link.fetchPriority = 'high';
                    link.dataset.productPreload = 'true';
                    document.head.appendChild(link);
                }
            });

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

    const handleDeleteProduct = (id) => {
        const product = products.find(p => p.id === id);
        if (product) {
            setProductToDelete(product);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            setIsDeleting(true);

            // 1. Delete Product Image from Storage (if applicable)
            if (productToDelete.imageUrl && productToDelete.imageUrl.includes('firebasestorage')) {
                try {
                    const imageRef = ref(storage, productToDelete.imageUrl);
                    await deleteObject(imageRef);
                } catch (storageError) {
                    console.error("Error deleting product image from Storage:", storageError);
                    // Continue even if image deletion fails
                }
            }

            // 2. Delete Product Doc from Firestore
            await deleteDoc(doc(db, "products", productToDelete.id));
            toast.success("Product and its image deleted successfully");
            setShowDeleteModal(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            if (!id) throw new Error("Product ID is missing");
            const productRef = doc(db, "products", String(id));
            await updateDoc(productRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            toast.success(`Product marked as ${newStatus}`);
            fetchProducts();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(`Failed to update status: ${error.message}`);
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
            nurseryName: "",
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
            nurseryName: product.nurseryName || "",
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
            p.category?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());
            
        const matchesStatus = statusFilter === "all" || 
            (statusFilter === "approved" && ['APPROVE', 'APPROVED', 'ACTIVE', 'AVAILABLE'].includes(String(p.status || "").toUpperCase())) ||
            (statusFilter === "rejected" && ['REJECT', 'REJECTED'].includes(String(p.status || "").toUpperCase()));
            
        const matchesNursery = nurseryFilter === "all" || 
            p.nurseryName?.trim().toLowerCase() === nurseryFilter?.trim().toLowerCase();
            
        const matchesCategory = categoryFilter === "all" || 
            p.category?.trim().toLowerCase() === categoryFilter?.trim().toLowerCase();
            
        return matchesSearch && matchesStatus && matchesNursery && matchesCategory;
    });

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

    // Lazy preload for subsequent pages
    useEffect(() => {
        // Only preload images beyond the first 10 (already handled in fetch)
        const beyond10 = paginatedProducts.slice(10);
        beyond10.forEach(product => {
            if (product.imageUrl) {
                const img = new Image();
                img.src = product.imageUrl;
            }
        });
    }, [paginatedProducts]);

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            {t('product:manage_inventory')}
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            {t('product:manage_desc')}
                        </p>
                    </div>

                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary (Mini) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title={t('product:total_products')}
                        value={products.length}
                        icon={Box}
                        variant="gray"
                    />
                    <StatCard
                        title={t('product:approved')}
                        value={products.filter(p => {
                            const s = String(p.status || "").toUpperCase();
                            return s === 'APPROVE' || s === 'APPROVED' || s === 'ACTIVE' || s === 'AVAILABLE';
                        }).length}
                        icon={CheckCircle}
                        variant="green"
                    />
                    <StatCard
                        title={t('product:pending')}
                        value={products.filter(p => p.status === 'pending').length}
                        icon={Clock}
                        variant="blue"
                    />
                    <StatCard
                        title={t('product:rejected')}
                        value={products.filter(p => {
                            const s = String(p.status || "").toUpperCase();
                            return s === 'REJECT' || s === 'REJECTED';
                        }).length}
                        icon={AlertCircle}
                        variant="red"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-bold text-gray-900">{t('common:search_filters')}</h5>
                        <div className="text-sm font-medium text-gray-500">
                            {t('common:total_records', { count: filteredProducts.length })}
                        </div>
                    </div>
                    <hr className="mt-0 mb-4 border-gray-200" />
                    <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
                        {/* Row 1: Search Bar */}
                        <div className="w-full flex flex-col gap-1.5 xl:flex-1">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('product:search_products')}</label>
                            <div className="relative group">
                                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={18} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('product:search_placeholder')}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-gray-700 bg-gray-50/30"
                                />
                            </div>
                        </div>

                        {/* Row 2: Filters Grid */}
                        <div className="grid grid-cols-2 lg:flex lg:flex-row items-end gap-3 w-full xl:w-auto">
                            <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[160px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('product:nursery')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                    <select
                                        value={nurseryFilter}
                                        onChange={(e) => setNurseryFilter(e.target.value)}
                                        className="w-full pl-8 pr-6 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                    >
                                        <option value="all">{t('product:all')}</option>
                                        {[...new Set(nurseries.map(n => n.nurseryName))].filter(Boolean).map((name) => (
                                            <option key={name} value={name.toLowerCase()}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[140px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('product:status')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-8 pr-6 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                    >
                                        <option value="all">{t('product:all')}</option>
                                        <option value="approved">{t('product:approved')}</option>
                                        <option value="rejected">{t('product:rejected')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('product:category')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2" size={14} />
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full pl-8 pr-6 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-white font-normal text-gray-700 min-w-[120px] uppercase tracking-tight"
                                    >
                                        <option value="all">{t('product:all')}</option>
                                        {[...new Set(products.map(p => p.category))].filter(Boolean).map((cat) => (
                                            <option key={cat} value={cat.toLowerCase()}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('product:rows')}</label>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-green-500 focus:border-green-500 block p-2 font-normal min-w-[70px]"
                                >
                                    {[5, 10, 25, 50].map((pageSize) => (
                                        <option key={pageSize} value={pageSize}>
                                            {pageSize}
                                        </option>
                                    ))}
                                </select>
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
                                        {t('product:sr_no')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                                        {t('product:image')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:product_name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:category')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:owner_name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:franchise')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:price')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:status')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    {t('product:loading_inventory')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedProducts.length ? (
                                    paginatedProducts.map((product, index) => (
                                        <tr
                                            key={product.id}
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setIsViewModalOpen(true);
                                            }}
                                            style={{ borderBottom: '1px solid #dae2eeff' }}
                                            className="bg-white transition-colors hover:!bg-green-50/50 cursor-pointer"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {String(startIndex + index + 1).padStart(2, "0")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center justify-center">
                                                    <ProductImage
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-12 h-12"
                                                        priority={startIndex + index < 10}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className="text-sm font-bold text-gray-900" title={product.name}>
                                                    {product.name?.length > 20 ? product.name.substring(0, 20) + "..." : product.name}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider" title={product.category}>
                                                    {product.category?.length > 15 ? product.category.substring(0, 15) + "..." : product.category}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const matchedNursery = nurseries.find(n => 
                                                            n.nurseryName?.trim().toLowerCase() === product.nurseryName?.trim().toLowerCase()
                                                        );
                                                        const displayName = matchedNursery?.ownerName || product.ownerName || "Admin";
                                                        return (
                                                            <>
                                                                <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-700 border border-green-100">
                                                                    {displayName[0]}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-700" title={displayName}>
                                                                    {displayName.length > 15 ? displayName.substring(0, 15) + "..." : displayName}
                                                                </span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-700" title={product.nurseryName}>
                                                    {product.nurseryName?.length > 15 ? product.nurseryName.substring(0, 15) + "..." : product.nurseryName || "-"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {String(Math.floor(product.price)).length > 5 ? "..." : `₹${product.price.toLocaleString("en-IN")}`}
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${['APPROVE', 'APPROVED', 'ACTIVE', 'AVAILABLE'].includes(String(product.status || "").toUpperCase()) ? "bg-green-50 text-green-700 border-green-200" :
                                                    ['REJECT', 'REJECTED'].includes(String(product.status || "").toUpperCase()) ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-blue-50 text-blue-700 border-blue-200"
                                                    }`}>
                                                    {product.status || "PENDING"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <div
                                                    className="flex items-center justify-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {/* Accept Button */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, "APPROVE")}
                                                        className={`p-1.5 rounded-full transition-colors border ${String(product.status || "").toUpperCase() === 'APPROVE' ? 'bg-green-100 text-green-700 border-green-200' : 'text-green-600 hover:text-green-800 hover:bg-green-50 border-green-100'}`}
                                                        title={t('product:approve')}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>

                                                    {/* Reject Button */}
                                                    <button
                                                        onClick={() => handleUpdateStatus(product.id, "REJECT")}
                                                        className={`p-1.5 rounded-full transition-colors border ${String(product.status || "").toUpperCase() === 'REJECT' ? 'bg-red-100 text-red-700 border-red-200' : 'text-red-600 hover:text-red-800 hover:bg-red-50 border-red-100'}`}
                                                        title={t('product:reject')}
                                                    >
                                                        <X size={18} />
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-1.5 rounded-full transition-colors border text-red-600 hover:text-red-800 hover:bg-red-50 border-red-100"
                                                        title={t('product:delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                                    <Package size={32} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-medium">
                                                    {t('product:no_products')}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer - Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <span className="text-base font-medium text-gray-500 whitespace-nowrap">
                                {t('common:pagination', { current: currentPage, total: Math.max(1, totalPages) })}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ProductViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    if (!isEditModalOpen) setSelectedProduct(null); // Keep if edit is open
                }}
                product={selectedProduct}
            />

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                }}
                onConfirm={confirmDeleteProduct}
                title={t('product:delete_product_q')}
                message={t('product:delete_msg')}
                itemName={productToDelete?.name}
                isGlobalLoading={isDeleting}
            />

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
                                {isAddModalOpen ? t('product:add_new_product') : t('product:edit_product')}
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
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:product_name_label')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={t('product:name_placeholder')}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:category')} <span className="text-red-500">*</span>
                                        </label>
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
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:status_label')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="pending">{t('product:pending')}</option>
                                            <option value="available">{t('product:available')}</option>
                                            <option value="rejected">{t('product:rejected')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('product:select_franchise')}</label>
                                        <select
                                            value={formData.nurseryName}
                                            onChange={(e) => {
                                                const selectedNursery = nurseries.find(n => n.nurseryName === e.target.value);
                                                setFormData({ 
                                                    ...formData, 
                                                    nurseryName: e.target.value,
                                                    ownerName: selectedNursery ? selectedNursery.ownerName : "Admin"
                                                });
                                            }}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="">{t('product:admin_no_franchise')}</option>
                                            {nurseries.map((n) => (
                                                <option key={n.id} value={n.nurseryName}>
                                                    {n.nurseryName} ({n.ownerName})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('product:owner_name')}</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={formData.ownerName}
                                            className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 outline-none cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:price_label')} <span className="text-red-500">*</span>
                                        </label>
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
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:stock_label')} <span className="text-red-500">*</span>
                                        </label>
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
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('product:image_url_label')}</label>
                                        <input
                                            type="url"
                                            value={formData.imageUrl}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('product:description_label')}</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder={t('product:desc_placeholder')}
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
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-sans"
                                    style={{ borderRadius: "12px" }}
                                >
                                    {t('common:cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border border-transparent font-sans"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <CheckCircle size={18} />
                                    {isAddModalOpen ? t('product:save_product') : t('product:update_product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                }}
                onConfirm={confirmDeleteProduct}
                title={t('product:delete_product_q')}
                message={t('product:delete_msg')}
                confirmText={t('product:delete_confirm')}
                itemName={productToDelete?.name}
                isGlobalLoading={isDeleting}
            />
        </div>
    );
}
