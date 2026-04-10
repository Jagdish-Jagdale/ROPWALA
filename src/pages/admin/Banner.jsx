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
import { db, storage } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Upload,
    CheckCircle,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    LayoutPanelTop,
} from "lucide-react";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

const BannerImage = ({ src, alt, className = "" }) => {
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
                    loading="lazy"
                    className={`w-full h-full object-cover transition-all duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setError(true);
                    }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                    <ImageIcon size={20} className="text-gray-300" />
                </div>
            )}
        </div>
    );
};

export default function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        isActive: true,
        imageUrl: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setBanners(data);
        } catch (error) {
            console.error("Error fetching banners:", error);
            toast.error("Failed to load banners");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBanner = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            toast.error("Please select a banner image");
            return;
        }

        try {
            setIsSubmitting(true);
            let imageUrl = "";

            // Upload image
            const storageRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
            const uploadResult = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(uploadResult.ref);

            const bannerData = {
                isActive: formData.isActive,
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "banners"), bannerData);
            toast.success("Banner added successfully");
            setIsAddModalOpen(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error("Error adding banner:", error);
            toast.error("Failed to add banner");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBanner = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            let imageUrl = formData.imageUrl;

            if (imageFile) {
                // Delete old image if it exists and is from storage
                if (formData.imageUrl && formData.imageUrl.includes("firebasestorage")) {
                    try {
                        const oldImageRef = ref(storage, formData.imageUrl);
                        await deleteObject(oldImageRef);
                    } catch (err) {
                        console.error("Error deleting old image:", err);
                    }
                }

                // Upload new image
                const timestamp = Date.now();
                const storageRef = ref(storage, `banners/${timestamp}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const bannerRef = doc(db, "banners", selectedBanner.id);
            await updateDoc(bannerRef, {
                isActive: formData.isActive,
                imageUrl: imageUrl,
                updatedAt: serverTimestamp(),
            });

            toast.success("Banner updated successfully");
            setIsEditModalOpen(false);
            setSelectedBanner(null);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error("Error updating banner:", error);
            toast.error("Failed to update banner");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBanner = async () => {
        if (!bannerToDelete) return;
        
        try {
            setIsDeleting(true);
            const { id, imageUrl } = bannerToDelete;

            // Delete image from storage if it exists
            if (imageUrl && imageUrl.includes("firebasestorage")) {
                try {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef);
                } catch (err) {
                    console.error("Error deleting image from storage:", err);
                }
            }
            await deleteDoc(doc(db, "banners", id));
            toast.success("Banner deleted successfully");
            setIsDeleteModalOpen(false);
            setBannerToDelete(null);
            fetchBanners();
        } catch (error) {
            console.error("Error deleting banner:", error);
            toast.error("Failed to delete banner");
        } finally {
            setIsDeleting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            isActive: true,
            imageUrl: "",
        });
        setImageFile(null);
        setImagePreview(null);
    };

    const openEditModal = (banner) => {
        setSelectedBanner(banner);
        setFormData({
            isActive: banner.isActive ?? true,
            imageUrl: banner.imageUrl || "",
        });
        setImageFile(null);
        setImagePreview(banner.imageUrl || null);
        setIsEditModalOpen(true);
    };

    // Filter and Pagination logic
    const filteredBanners = banners; // No text search required for banners usually, but keeping skeleton

    const totalPages = Math.ceil(filteredBanners.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedBanners = filteredBanners.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            Banner Section
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            Manage your application marketing banners
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
                        Add Banner
                    </button>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Banners Grid */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-base text-gray-500 font-bold tracking-tight">Loading banners...</span>
                        </div>
                    </div>
                ) : paginatedBanners.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {paginatedBanners.map((p, index) => (
                            <div 
                                key={p.id} 
                                className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Banner Image Box */}
                                <div className="relative aspect-[21/9] overflow-hidden bg-gray-50 border-b border-gray-100">
                                    <BannerImage
                                        src={p.imageUrl}
                                        alt="Banner"
                                        className="w-full h-full"
                                    />
                                    {/* SR NO Badge */}
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        # {String(startIndex + index + 1).padStart(2, "0")}
                                    </div>
                                </div>

                                {/* Card Footer/Actions */}
                                <div className="p-4 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-widest ${
                                            p.isActive 
                                            ? "bg-green-100 text-green-700 border border-green-200" 
                                            : "bg-red-100 text-red-700 border border-red-200"
                                        }`}>
                                            {p.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(p)}
                                            className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-xl transition-all shadow-sm border border-green-100"
                                            title="Edit Banner"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setBannerToDelete(p);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm border border-red-100"
                                            title="Delete Banner"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-20 text-center flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-50 rounded-full">
                            <ImageIcon size={40} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-bold">No banners added yet.</p>
                        <button
                            onClick={() => {
                                resetForm();
                                setIsAddModalOpen(true);
                            }}
                            className="text-green-600 font-bold text-sm hover:underline"
                        >
                            Add your first banner
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {filteredBanners.length > rowsPerPage && (
                    <div className="flex items-center justify-end px-2 py-4">
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400 transition-colors"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <span className="text-sm font-bold text-gray-500 min-w-[100px] text-center">
                                Page {currentPage} of {Math.max(1, totalPages)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400 transition-colors"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !isSubmitting && (setIsAddModalOpen(false) || setIsEditModalOpen(false))}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <LayoutPanelTop className="text-green-600" size={24} />
                                {isAddModalOpen ? "Add New Banner" : "Edit Banner"}
                            </h3>
                            <button onClick={() => !isSubmitting && (setIsAddModalOpen(false) || setIsEditModalOpen(false))} className="text-gray-400 p-1 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={isAddModalOpen ? handleAddBanner : handleUpdateBanner} className="p-6 space-y-6 text-center lg:text-left">
                            {/* Image Upload */}
                            <div className="space-y-1.5 ">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Banner Image</label>
                                <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-2xl hover:border-green-400 transition-colors">
                                    <div className="w-full h-32 bg-white border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={40} className="text-gray-200" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="banner-image"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setImageFile(file);
                                                setImagePreview(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="banner-image"
                                        className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Upload size={18} />
                                        {imagePreview ? "Change Image" : "Upload Banner Image"}
                                    </label>
                                </div>
                            </div>

                            {/* Status Checkbox */}
                            <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-100 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="status-checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                                />
                                <label htmlFor="status-checkbox" className="text-sm font-bold text-gray-700 cursor-pointer">
                                    Show this banner to users (Active)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => (setIsAddModalOpen(false) || setIsEditModalOpen(false))}
                                    className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all ml-1"
                                    style={{ borderRadius: "12px" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-100"
                                    style={{ borderRadius: "12px" }}
                                >
                                    {isSubmitting ? "Processing..." : (isAddModalOpen ? "Add Banner" : "Update Banner")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                        setBannerToDelete(null);
                    }
                }}
                onConfirm={handleDeleteBanner}
                title="Delete Marketing Banner?"
                message="This action cannot be undone. This banner will no longer be visible to your customers."
                confirmText="DELETE BANNER"
                itemName="this banner"
                isGlobalLoading={isDeleting}
            />
        </div>
    );
}
