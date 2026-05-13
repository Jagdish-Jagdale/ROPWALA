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
    Flame,
    Box,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import OurProductViewModal from "../../components/OurProductViewModal";
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

export default function AdminOurProducts() {
    const { t } = useTranslation(['product', 'common']);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Delete Modal Statepp
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        description: "",
        imageUrls: [],
        showInOwnerDashboard: true,
        ispopular: false,
        istrending: false,
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
                ispopular: formData.ispopular,
                istrending: formData.istrending,
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

            // Start with existing URLs that user kept
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
                ispopular: formData.ispopular,
                istrending: formData.istrending,
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

    const handleDeleteProduct = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            setIsDeleting(true);
            const urls = productToDelete.imageUrls || (productToDelete.imageUrl ? [productToDelete.imageUrl] : []);
            for (const url of urls) {
                if (url && url.includes('firebasestorage')) {
                    try { await deleteObject(ref(storage, url)); } catch (e) { /* ignore */ }
                }
            }
            await deleteDoc(doc(db, "ourproduct", productToDelete.id));
            toast.success("Product deleted successfully");
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

    const toggleFeature = async (id, field, currentValue) => {
        try {
            if (!id) throw new Error("Product ID is missing");
            const productRef = doc(db, "ourproduct", String(id));
            await updateDoc(productRef, {
                [field]: !currentValue,
                updatedAt: serverTimestamp(),
            });
            toast.success(`Feature updated successfully`);
            fetchProducts();
        } catch (error) {
            console.error("Error updating feature:", error);
            toast.error(`Failed to update feature`);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            price: "",
            description: "",
            imageUrls: [],
            showInOwnerDashboard: true,
            ispopular: false,
            istrending: false,
            stock: 0,
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
            showInOwnerDashboard: product.showInOwnerDashboard !== false,
            ispopular: product.ispopular || false,
            istrending: product.istrending || false,
            stock: product.stock || 0,
        });
        setImageFiles([]);
        setImagePreviews([...existingUrls]);
        setMainImageIndex(0);
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

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
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
                            {t('product:our_products')}
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            {t('product:our_products_desc')}
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
                        {t('product:add_our_product')}
                    </button>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title={t('product:total_our_products')}
                        value={products.length}
                        icon={Box}
                        variant="gray"
                    />
                    <StatCard
                        title={t('product:visible')}
                        value={products.filter(p => p.showInOwnerDashboard !== false).length}
                        icon={CheckCircle}
                        variant="green"
                    />
                    <StatCard
                        title={t('product:hidden')}
                        value={products.filter(p => p.showInOwnerDashboard === false).length}
                        icon={AlertCircle}
                        variant="red"
                    />
                    <StatCard
                        title={t('product:product_images')}
                        value={products.reduce((acc, p) => acc + (p.imageUrls?.length || 0), 0)}
                        icon={ImageIcon}
                        variant="blue"
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

                        <div className="grid grid-cols-2 lg:flex lg:flex-row items-end gap-3 w-full xl:w-auto">
                            <div className="flex flex-col gap-1.5 lg:flex-none lg:w-[100px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('product:rows')}</label>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 transition-all text-center"
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
                                        {t('product:sr_no')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:image')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:product_name')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:price')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('product:description_label')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                                        <td colSpan={8} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    {t('product:loading_inventory')}
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

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {p.stock || 0}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5">
                                                <p className="text-xs text-gray-500 line-clamp-1 max-w-[300px]" title={p.description}>
                                                    {p.description && p.description.length > 60
                                                        ? p.description.substring(0, 60) + "..."
                                                        : (p.description || t('common:no_description'))}
                                                </p>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                {p.showInOwnerDashboard !== false ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                        {t('product:visible')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                                        {t('product:hidden')}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                        title={t('product:edit')}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p)}
                                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                        title={t('product:delete')}
                                                    >
                                                        <Trash2 size={16} />
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
                                                    {t('product:no_products')}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

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

            <OurProductViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    if (!isEditModalOpen) setSelectedProduct(null);
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
                title={t('product:delete_our_product_q')}
                message={t('product:delete_our_msg')}
                itemName={productToDelete?.name}
                isGlobalLoading={isDeleting}
            />

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

                        <form onSubmit={isAddModalOpen ? handleAddProduct : handleUpdateProduct}>
                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">


                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t('product:name_placeholder')}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {t('product:product_images')} <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                    <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-xl">
                                        {imagePreviews.length > 0 && (
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {imagePreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative group/img">
                                                        <div className={`w-full aspect-square rounded-xl bg-white overflow-hidden border ${mainImageIndex === idx ? 'border-green-500 border-2' : 'border-gray-100'}`}>
                                                            <img src={preview} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="absolute top-1.5 right-1.5">
                                                            <input type="checkbox" checked={mainImageIndex === idx} onChange={() => setMainImageIndex(idx)} className="w-4 h-4 rounded text-green-600" />
                                                        </div>
                                                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1.5 left-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all">
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" id="product-image" className="hidden" multiple onChange={handleImageSelect} />
                                        <label htmlFor="product-image" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer w-full">
                                            <Upload size={16} />
                                            {imagePreviews.length === 0 ? t('product:upload_images') : t('product:add_more_images')}
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                            {t('product:price_label')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-semibold text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                            Stock <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-semibold text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('product:description_label')}</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all resize-none text-sm"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setIsEditModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 !rounded-md transition-all"
                                >
                                    {t('common:cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-green-600 text-white !rounded-md transition-all flex items-center gap-2 disabled:bg-green-400 font-bold"
                                >
                                    {isSubmitting ? t('product:processing') : (isAddModalOpen ? t('product:add_product_btn') : t('product:update_changes'))}
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
                title={t('product:delete_company_product_q')}
                message={t('product:delete_company_product_msg')}
                confirmText={t('product:delete_our_product_confirm')}
                itemName={productToDelete?.name}
                isGlobalLoading={isDeleting}
            />
        </div>
    );
}
