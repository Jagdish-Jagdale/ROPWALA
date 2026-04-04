import { useEffect, useState } from "react";
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
import OurProductViewModal from "../../components/OurProductViewModal";

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

export default function AdminOurProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        imageUrls: [],
        showInOwnerDashboard: true,
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "ourproduct"), orderBy("createdAt", "desc"));
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
                const firstImage = product.imageUrls?.[0] || product.imageUrl;
                if (firstImage) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = firstImage;
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
        if (imageFiles.length === 0) {
            toast.error("Please select at least one product image");
            return;
        }

        try {
            setIsSubmitting(true);
            const uploadedUrls = [];

            // Upload all images
            for (const file of imageFiles) {
                const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
                const uploadResult = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(uploadResult.ref);
                uploadedUrls.push(url);
            }

            // Reorder so main image is first
            const orderedUrls = [
                uploadedUrls[mainImageIndex],
                ...uploadedUrls.filter((_, i) => i !== mainImageIndex)
            ];

            const productData = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                imageUrls: orderedUrls,
                imageUrl: orderedUrls[0], // backward compat: main image
                showInOwnerDashboard: formData.showInOwnerDashboard,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "ourproduct"), productData);
            toast.success("Product added successfully");
            setIsAddModalOpen(false);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Failed to add product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);

            // Start with existing URLs that user kept (from previews that are URLs, not blobs)
            const keptUrls = imagePreviews.filter(p => !p.startsWith('blob:'));

            // Upload new files
            const newUrls = [];
            for (const file of imageFiles) {
                const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
                const uploadResult = await uploadBytes(storageRef, file);
                const url = await getDownloadURL(uploadResult.ref);
                newUrls.push(url);
            }

            const allUrls = [...keptUrls, ...newUrls];

            // Reorder so selected main image is first
            const mainUrl = allUrls[mainImageIndex] || allUrls[0];
            const orderedUrls = mainUrl
                ? [mainUrl, ...allUrls.filter(u => u !== mainUrl)]
                : allUrls;

            // Delete removed old images from storage
            const oldUrls = selectedProduct.imageUrls || (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []);
            const removedUrls = oldUrls.filter(u => !keptUrls.includes(u));
            for (const url of removedUrls) {
                if (url.includes('firebasestorage')) {
                    try { await deleteObject(ref(storage, url)); } catch (e) { /* ignore */ }
                }
            }

            const productRef = doc(db, "ourproduct", selectedProduct.id);
            await updateDoc(productRef, {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                imageUrls: orderedUrls,
                imageUrl: orderedUrls[0] || "",
                showInOwnerDashboard: formData.showInOwnerDashboard,
                updatedAt: serverTimestamp(),
            });

            toast.success("Product updated successfully");
            setIsEditModalOpen(false);
            setSelectedProduct(null);
            resetForm();
            fetchProducts();
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (product) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                // Delete all images from storage
                const urls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
                for (const url of urls) {
                    if (url && url.includes('firebasestorage')) {
                        try { await deleteObject(ref(storage, url)); } catch (e) { /* ignore */ }
                    }
                }
                await deleteDoc(doc(db, "ourproduct", product.id));
                toast.success("Product deleted");
                fetchProducts();
            } catch (error) {
                toast.error("Failed to delete product");
            }
        }
    };


    const resetForm = () => {
        setFormData({
            name: "",
            price: "",
            description: "",
            imageUrls: [],
            showInOwnerDashboard: true,
        });
        setImageFiles([]);
        setImagePreviews([]);
        setMainImageIndex(0);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        const existingUrls = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
        setFormData({
            name: product.name || "",
            price: product.price?.toString() || "",
            description: product.description || "",
            imageUrls: existingUrls,
            showInOwnerDashboard: product.showInOwnerDashboard !== false, // default true if missing
        });
        setImageFiles([]);
        setImagePreviews([...existingUrls]);
        setMainImageIndex(0); // first existing image is main by default
        setIsEditModalOpen(true);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setImageFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        const preview = imagePreviews[index];
        const isBlob = preview.startsWith('blob:');

        setImagePreviews(prev => prev.filter((_, i) => i !== index));

        // Adjust main index
        if (mainImageIndex === index) {
            setMainImageIndex(0);
        } else if (mainImageIndex > index) {
            setMainImageIndex(prev => prev - 1);
        }

        if (isBlob) {
            const blobPreviews = imagePreviews.filter(p => p.startsWith('blob:'));
            const blobIndex = blobPreviews.indexOf(preview);
            if (blobIndex > -1) {
                setImageFiles(prev => prev.filter((_, i) => i !== blobIndex));
            }
            URL.revokeObjectURL(preview);
        }
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
            p.description?.toLowerCase().includes(search.toLowerCase());
            
        return matchesSearch;
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
                            Our Products
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            View and manage your own product catalog
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm font-medium text-sm border border-transparent font-sans"
                        style={{ borderRadius: "12px" }}
                    >
                        <Plus size={18} />
                        Add Our Product
                    </button>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary (Mini) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Our Products"
                        value={products.length}
                        icon={Package}
                        variant="green"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-bold text-gray-900">Search & Filters</h5>
                        <div className="text-sm font-medium text-gray-500">
                            Total {filteredProducts.length} records
                        </div>
                    </div>
                    <hr className="mt-0 mb-4 border-gray-200" />
                    <div className="flex flex-row items-end gap-3 w-full">
                        {/* Search Bar */}
                        <div className="flex-grow flex flex-col gap-1.5">
                            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-1">Search Products</label>
                            <div className="relative">
                                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2" size={18} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="e.g. Arabian Jasmine or Plants"
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Filters Wrapper */}
                        <div className="flex flex-row items-end gap-3 flex-none">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-1">Rows</label>
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
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Sr No
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Product Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Dashboard
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    Loading inventory...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedProducts.length ? (
                                    paginatedProducts.map((p, index) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProduct(p);
                                                setIsViewModalOpen(true);
                                            }}
                                            style={{ borderBottom: '1px solid #dae2eeff' }}
                                            className="bg-white transition-colors cursor-pointer hover:!bg-green-50"
                                        >
                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <span className="text-sm text-gray-900">
                                                    {String(startIndex + index + 1).padStart(2, "0")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center justify-center">
                                                    <ProductImage
                                                        src={p.imageUrls?.[0] || p.imageUrl}
                                                        alt={p.name}
                                                        priority={index < 5}
                                                        className="w-10 h-10 rounded-lg shadow-sm"
                                                    />
                                                    {p.imageUrls?.length > 1 && (
                                                        <span className="ml-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-lg">+{p.imageUrls.length - 1}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900" title={p.name}>
                                                        {p.name.length > 30 ? p.name.substring(0, 30) + "..." : p.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span className="text-sm font-bold text-green-700">
                                                    ₹{p.price?.toLocaleString("en-IN")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5">
                                                <p className="text-xs text-gray-500 line-clamp-1 max-w-[300px]" title={p.description}>
                                                    {p.description && p.description.length > 60 
                                                        ? p.description.substring(0, 60) + "..." 
                                                        : (p.description || "No description provided")}
                                                </p>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                {p.showInOwnerDashboard !== false ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                        Visible
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                        Hidden
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p)}
                                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
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
                                Page {currentPage} of {Math.max(1, totalPages)}
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

            <OurProductViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    if (!isEditModalOpen) setSelectedProduct(null); // Keep if edit is open
                }}
                product={selectedProduct}
            />

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => {
                            if (isSubmitting) return;
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
                                    if (isSubmitting) return;
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
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Show in Owner Dashboard — Toggle (top) */}
                                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Owner Dashboard Visibility</span>
                                        <span className={`text-sm font-semibold mt-0.5 ${
                                            formData.showInOwnerDashboard ? 'text-green-700' : 'text-gray-500'
                                        }`}>
                                            {formData.showInOwnerDashboard ? 'Visible — shown on owner dashboard' : 'Hidden — not shown on owner dashboard'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, showInOwnerDashboard: !formData.showInOwnerDashboard })}
                                        title={formData.showInOwnerDashboard ? 'Click to hide from owner dashboard' : 'Click to show on owner dashboard'}
                                        style={{ width: '52px', height: '28px', borderRadius: '999px', padding: '3px', transition: 'background-color 0.25s', backgroundColor: formData.showInOwnerDashboard ? '#22c55e' : '#d1d5db', flexShrink: 0, display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer', outline: 'none', boxShadow: formData.showInOwnerDashboard ? '0 0 0 3px rgba(34,197,94,0.18)' : '0 0 0 3px rgba(0,0,0,0.06)' }}
                                    >
                                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', display: 'block', transform: formData.showInOwnerDashboard ? 'translateX(24px)' : 'translateX(0px)', transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)' }} />
                                    </button>
                                </div>

                                {/* Product Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Arabian Jasmine Plant"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Image Upload - Multiple */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Product Images
                                        </label>
                                        {imagePreviews.length > 0 && (
                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                                                {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-xl hover:border-green-400 transition-colors">
                                        {/* Image previews grid */}
                                        {imagePreviews.length > 0 && (
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {imagePreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative group/img">
                                                        <div className={`w-full aspect-square rounded-xl bg-white overflow-hidden shadow-sm transition-all ${
                                                            mainImageIndex === idx
                                                                ? 'border-2 border-green-500 ring-2 ring-green-200'
                                                                : 'border border-gray-100'
                                                        }`}>
                                                            <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                        </div>

                                                        {/* Main badge */}
                                                        {mainImageIndex === idx && (
                                                            <span className="absolute bottom-1.5 left-1.5 bg-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                                                Main
                                                            </span>
                                                        )}

                                                        {/* Set-as-main tick button (shows on hover for non-main) */}
                                                        {mainImageIndex !== idx && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setMainImageIndex(idx)}
                                                                title="Set as main image"
                                                                className="absolute bottom-1.5 left-1.5 w-6 h-6 bg-white/90 backdrop-blur-sm text-green-700 border border-green-300 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover/img:opacity-100 transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        )}

                                                        {/* Remove button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/img:opacity-100 transition-all hover:bg-red-600 hover:scale-110"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Upload button - always visible */}
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="product-image"
                                                className="hidden"
                                                multiple
                                                onChange={handleImageSelect}
                                            />
                                            <label
                                                htmlFor="product-image"
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all shadow-sm w-full"
                                                style={{ borderRadius: "12px" }}
                                            >
                                                <Upload size={16} />
                                                {imagePreviews.length === 0 ? "Upload Product Images" : "Add More Images"}
                                            </label>
                                        </>

                                        {imagePreviews.length > 0 && (
                                            <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                                                Hover an image and click ✓ to set it as the main display image
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Price (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-semibold text-gray-700"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Briefly describe the product..."
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none text-sm"
                                    ></textarea>
                                </div>


                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none transition-all disabled:opacity-50"
                                    style={{ borderRadius: "12px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none transition-all flex items-center gap-2 shadow-md shadow-green-200 disabled:bg-green-400"
                                    style={{ borderRadius: "12px" }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            {isAddModalOpen ? "Add Product" : "Update Changes"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
