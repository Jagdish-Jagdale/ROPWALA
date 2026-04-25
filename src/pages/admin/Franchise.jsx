import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    collection,
    getDocs,
    query,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    onSnapshot,
    where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, storage } from "../../lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import toast from "react-hot-toast";
import {
    Search,
    Filter,
    MapPin,
    XCircle,
    Clock,
    Mail,
    Phone,
    ChevronLeft,
    ChevronRight,
    User,
    Users,
    MoreVertical,
    Calendar,
    FileText,
    CheckCircle,
    X,
    Trash2,
    Building,
    Trees,
    AlertCircle,
    ClipboardList,
    PauseCircle,
    Lock,
    Eye,
    EyeOff,
    MessageSquare,
    Image as ImageIcon
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

export default function AdminFranchise() {
    const { t } = useTranslation(['franchise', 'common']);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [nurseryFilter, setNurseryFilter] = useState("all");
    const [dateSort, setDateSort] = useState("newest");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [franchiseToDelete, setFranchiseToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [previewState, setPreviewState] = useState({ isOpen: false, images: [], index: 0 });

    useEffect(() => {
        const unsubscribe = fetchApplications();
        return () => unsubscribe && unsubscribe();
    }, []);

    const fetchApplications = () => {
        setLoading(true);
        const q = query(
            collection(db, "franchise"),
            orderBy("applicationDate", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map((d) => ({
                ...d.data(),
                id: d.id,
            }));
            setApplications(apps);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching applications:", error);
            // Fallback for case where index doesn't exist yet for applicationDate
            const fallbackQ = query(collection(db, "franchise"));
            onSnapshot(fallbackQ, (fallbackSnap) => {
                const apps = fallbackSnap.docs.map((d) => ({
                    ...d.data(),
                    id: d.id,
                })).sort((a, b) => (b.applicationDate || 0) - (a.applicationDate || 0));
                setApplications(apps);
                setLoading(false);
            });
        });
    };

    const updateStatus = async (id, newStatus) => {
        if (!id) return;
        try {
            const docId = String(id);
            const docRef = doc(db, "franchise", docId);
            const statusToSave = newStatus.toUpperCase();
            await updateDoc(docRef, { status: statusToSave });

            setApplications(prev =>
                prev.map(app => app.id === id ? { ...app, status: statusToSave } : app)
            );

            toast.success(t('franchise:status_updated', { status: newStatus }));
        } catch (e) {
            console.error("Error updating status:", e);
            toast.error(t('franchise:status_update_failed'));
        }
    };

    const handleDeleteFranchise = (id) => {
        const app = applications.find(a => a.id === id);
        if (app) {
            setFranchiseToDelete(app);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteFranchise = async () => {
        if (!franchiseToDelete) return;

        try {
            setIsDeleting(true);

            // 1. Delete from Firebase Authentication via Cloud Function (if UID exists)
            if (franchiseToDelete.uid) {
                await toast.promise(
                    (async () => {
                        const deleteAuthFn = httpsCallable(functions, "deleteUserAuth");
                        const result = await deleteAuthFn({ uid: franchiseToDelete.uid });

                        if (!result.data.success) {
                            throw new Error(result.data.message || "Failed to delete from Auth");
                        }
                        return result.data;
                    })(),
                    {
                        loading: t('franchise:removing_creds'),
                        success: (data) => data.message || t('common:save_success'),
                        error: (err) => `Auth cleanup failed: ${err.message}`,
                    }
                );
            } else {
                toast.error(t('franchise:no_auth_notice'), { duration: 5000 });
            }

            // 2. Cascading Cleanup: Delete all products belonging to this franchise
            try {
                const productsQuery = query(
                    collection(db, "products"),
                    where("ownerId", "==", franchiseToDelete.id)
                );
                const productSnapshot = await getDocs(productsQuery);

                for (const productDoc of productSnapshot.docs) {
                    const productData = productDoc.data();

                    // a) Delete Product Image from Storage
                    if (productData.imageUrl && productData.imageUrl.includes('firebasestorage')) {
                        try {
                            const imageRef = ref(storage, productData.imageUrl);
                            await deleteObject(imageRef);
                        } catch (e) {
                            console.error(`Error deleting image for product ${productDoc.id}:`, e);
                        }
                    }

                    // b) Delete Product Doc from Firestore
                    await deleteDoc(doc(db, "products", productDoc.id));
                }
                console.log(`Cascade cleanup complete: Deleted ${productSnapshot.size} products.`);
            } catch (cascadeError) {
                console.error("Error during cascading product cleanup:", cascadeError);
                // We proceed with franchise deletion even if cascade fails
            }

            // 3. Delete from Firestore (Proceed even if no UID)
            await deleteDoc(doc(db, "franchise", franchiseToDelete.id));
            toast.success(t('franchise:delete_success'));
            setShowDeleteModal(false);
            setFranchiseToDelete(null);
        } catch (error) {
            console.error("Error deleting franchise:", error);
            // We only abort if there was a UID to delete and it failed.
            toast.error(t('franchise:delete_aborted'));
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredApps = applications.filter((app) => {
        const nameStr = (app.ownerName || "").toLowerCase();
        const emailStr = (app.ownerEmail || "").toLowerCase();
        const phoneStr = (app.ownerPhone || "");
        const nurseryStr = (app.nurseryName || "").toLowerCase();

        const matchesSearch =
            !search ||
            nameStr.includes(search.toLowerCase()) ||
            emailStr.includes(search.toLowerCase()) ||
            nurseryStr.includes(search.toLowerCase()) ||
            phoneStr.includes(search);

        const matchesStatus = statusFilter === "all" || app.status?.toLowerCase() === statusFilter.toLowerCase();
        const matchesNursery = nurseryFilter === "all" || app.nurseryName === nurseryFilter;

        return matchesSearch && matchesStatus && matchesNursery;
    }).sort((a, b) => {
        if (dateSort === "newest") {
            const dateA = a.applicationDate?.seconds ? a.applicationDate.seconds * 1000 : new Date(a.applicationDate || 0).getTime();
            const dateB = b.applicationDate?.seconds ? b.applicationDate.seconds * 1000 : new Date(b.applicationDate || 0).getTime();
            return dateB - dateA;
        }
        if (dateSort === "oldest") {
            const dateA = a.applicationDate?.seconds ? a.applicationDate.seconds * 1000 : new Date(a.applicationDate || 0).getTime();
            const dateB = b.applicationDate?.seconds ? b.applicationDate.seconds * 1000 : new Date(b.applicationDate || 0).getTime();
            return dateA - dateB;
        }
        if (dateSort === "name-asc") return (a.nurseryName || "").localeCompare(b.nurseryName || "");
        if (dateSort === "name-desc") return (b.nurseryName || "").localeCompare(a.nurseryName || "");
        return 0;
    });

    // Get unique nursery names for filter
    const uniqueNurseries = Array.from(new Set(applications.map(app => app.nurseryName).filter(Boolean))).sort();

    // Pagination
    const totalPages = Math.ceil(filteredApps.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedApps = filteredApps.slice(startIndex, startIndex + rowsPerPage);

    const getStatusColor = (status, isHero = false) => {
        const s = status?.toLowerCase();
        if (isHero) {
            switch (s) {
                case "approved":
                case "accepted": return "bg-green-500/20 text-green-300 border-green-400/30 backdrop-blur-md";
                case "hold": return "bg-amber-500/20 text-yellow-300 border-yellow-400/30 backdrop-blur-md";
                case "pending": return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 backdrop-blur-md";
                case "rejected": return "bg-red-500/20 text-red-300 border-red-400/30 backdrop-blur-md";
                default: return "bg-white/10 text-white/90 border-white/20 backdrop-blur-md";
            }
        }
        switch (s) {
            case "approved":
            case "accepted": return "bg-green-100 text-green-700 border-green-200 uppercase";
            case "hold": return "bg-amber-100 text-amber-700 border-amber-200 uppercase";
            case "pending": return "bg-emerald-100 text-emerald-700 border-emerald-200 uppercase";
            case "rejected":
            case "reject": return "bg-red-100 text-red-700 border-red-200 uppercase";
            default: return "bg-gray-100 text-gray-700 border-gray-200 uppercase";
        }
    };

    const formatDate = (date) => {
        if (!date) return t('franchise:n_a');
        const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        return d.toLocaleDateString('en-GB');
    };

    const getPhotos = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            if (data.includes('[') && data.includes(']')) {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) { }
            }
            if (data.startsWith('http')) return [data];
        }
        return [];
    };

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            {t('franchise:manage_franchise_apps')}
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            {t('franchise:manage_franchise_desc')}
                        </p>
                    </div>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title={t('franchise:total_apps')}
                        value={applications.length}
                        icon={ClipboardList}
                        variant="gray"
                    />
                    <StatCard
                        title={t('franchise:approved')}
                        value={applications.filter(a => a.status?.toUpperCase() === 'APPROVED' || a.status?.toUpperCase() === 'ACCEPTED').length}
                        icon={CheckCircle}
                        variant="green"
                    />
                    <StatCard
                        title={t('franchise:pending')}
                        value={applications.filter(a => a.status?.toUpperCase() === 'PENDING' || !a.status).length}
                        icon={Clock}
                        variant="blue"
                    />
                    <StatCard
                        title={t('franchise:rejected')}
                        value={applications.filter(a => a.status?.toUpperCase() === 'REJECTED' || a.status?.toUpperCase() === 'REJECT').length}
                        icon={XCircle}
                        variant="red"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-lg font-bold text-gray-900">{t('common:search_filters')}</h5>
                        <div className="text-sm font-medium text-gray-500">
                            {t('common:total_records', { count: filteredApps.length })}
                        </div>
                    </div>
                    <hr className="mt-0 mb-4 border-gray-200" />
                    <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
                        {/* Row 1: Search Bar */}
                        <div className="w-full flex flex-col gap-1.5 xl:flex-1">
                            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('franchise:search_apps')}</label>
                            <div className="relative group">
                                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={18} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('franchise:search_placeholder')}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-gray-700 bg-gray-50/30"
                                />
                            </div>
                        </div>

                        {/* Row 2: Filters Grid */}
                        <div className="grid grid-cols-2 lg:flex lg:flex-row items-end gap-3 w-full xl:w-auto">
                            {/* Status Filter */}
                            <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[130px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('franchise:status_label')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                    >
                                        <option value="all">{t('common:all')}</option>
                                        <option value="pending">{t('franchise:pending')}</option>
                                        <option value="approved">{t('franchise:approved')}</option>
                                        <option value="rejected">{t('franchise:rejected')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Franchise (Nursery) Filter */}
                            <div className="flex flex-col gap-1.5 col-span-2 lg:col-span-1 lg:flex-none lg:w-[150px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('franchise:franchise_label')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                    <select
                                        value={nurseryFilter}
                                        onChange={(e) => setNurseryFilter(e.target.value)}
                                        className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                    >
                                        <option value="all">{t('common:all')}</option>
                                        {uniqueNurseries.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date sort Filter */}
                            <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[130px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('franchise:sort_by')}</label>
                                <div className="relative group">
                                    <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                                    <select
                                        value={dateSort}
                                        onChange={(e) => setDateSort(e.target.value)}
                                        className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                                    >
                                        <option value="newest">{t('franchise:newest')}</option>
                                        <option value="oldest">{t('franchise:oldest')}</option>
                                        <option value="name-asc">{t('franchise:a_z')}</option>
                                        <option value="name-desc">{t('franchise:z_a')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Rows Selectors */}
                            <div className="flex flex-col gap-1.5 col-span-2 lg:flex-none lg:w-[100px]">
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('common:rows')}</label>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 transition-all text-center"
                                >
                                    {[5, 10, 20, 50].map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0">
                            {/* ... table content ... */}
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('common:sr_no')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('common:image')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('franchise:applicant_nursery')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('franchise:contact')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('franchise:applied_on')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('franchise:status_label')}
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t('common:action')}
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
                                                    {t('franchise:loading_apps')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedApps.length ? (
                                    paginatedApps.map((app, index) => (
                                        <tr
                                            key={app.id}
                                            onClick={() => setSelectedApp(app)}
                                            style={{ borderBottom: '1px solid #dae2eeff' }}
                                            className="bg-white transition-colors cursor-pointer hover:!bg-green-50"
                                        >
                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <span className="text-sm text-gray-900">
                                                    {String(startIndex + index + 1).padStart(2, "0")}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm">
                                                    {app.profilePhotoUrl ? (
                                                        <img src={app.profilePhotoUrl} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full bg-slate-100">
                                                            <User size={18} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {app.ownerName || t('franchise:unknown_applicant')}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-semibold">
                                                        {app.nurseryName || t('franchise:n_a')}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-gray-900">
                                                        {app.ownerEmail || app.nurseryEmail || t('franchise:n_a')}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {app.ownerPhone || app.nurseryPhone || t('franchise:n_a')}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(app.applicationDate)}
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(app.status)}`}>
                                                    {app.status || t('franchise:pending')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {app.status !== "approved" && (
                                                        <button
                                                            onClick={() => updateStatus(app.id, "approved")}
                                                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                            title={t('common:approve')}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {app.status !== "rejected" && (
                                                        <button
                                                            onClick={() => updateStatus(app.id, "rejected")}
                                                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                            title={t('franchise:reject')}
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteFranchise(app.id)}
                                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                        title={t('common:delete')}
                                                    >
                                                        <Trash2 size={18} />
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
                                                    <User size={32} className="opacity-50" />
                                                </div>
                                                <p className="text-sm font-medium">
                                                    {t('franchise:no_apps_found')}
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

            {/* View Detail Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-28 md:py-32">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedApp(null)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="text-green-600" size={24} />
                                {t('franchise:app_details')}
                            </h3>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 py-0 overflow-y-auto max-h-[75vh]">
                            {(() => {
                                const photos = getPhotos(selectedApp.nurseryPhotosJson);
                                const heroPhoto = photos.length > 0 ? photos[0] : null;

                                return (
                                    <div className="relative -mx-6 mb-10 h-64 flex flex-col items-center justify-center overflow-hidden">
                                        {/* Background Hero with Overlay */}
                                        <div className="absolute inset-0 z-0">
                                            <img src="/loginbg.jpg" className="w-full h-full object-cover scale-105 transition-transform duration-700 group-hover:scale-100" alt="" />
                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

                                            {/* Decorative Elements */}
                                            <div className="absolute top-6 left-8 opacity-20 pointer-events-none">
                                                <div className="grid grid-cols-5 gap-2">
                                                    {[...Array(15)].map((_, i) => (
                                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
                                        </div>

                                        {/* Profile Content */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 shadow-2xl transition-transform hover:scale-105 duration-300">
                                                {selectedApp.profilePhotoUrl ? (
                                                    <img src={selectedApp.profilePhotoUrl} alt={selectedApp.ownerName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full bg-black/40">
                                                        <User size={56} className="text-white/80" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-2xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{selectedApp.ownerName}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shadow-lg transition-all ${getStatusColor(selectedApp.status, true)}`}>
                                                    {selectedApp.status || t('franchise:pending')}
                                                </span>
                                                <span className="text-xs text-white/80 font-semibold drop-shadow-md bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                    {t('franchise:applied_on')} {formatDate(selectedApp.applicationDate)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dynamic Header Bottom Bar */}
                                        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <section className="p-6 bg-white border border-gray-100 !rounded-sm shadow-sm">
                                    <h4 className="text-sm font-bold text-green-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50">
                                        <User size={20} /> {t('franchise:personal_info')}
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:email')}</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 break-all">
                                                {selectedApp.ownerEmail || t('franchise:n_a')}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:phone')}</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                                {selectedApp.ownerPhone || t('franchise:n_a')}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Password</label>
                                            <div className="relative">
                                                <p className="text-sm font-mono font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    {showPassword ? (selectedApp.ownerPassword || "No Password Set") : "••••••••••••"}
                                                </p>
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:res_address')}</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                {selectedApp.ownerAddress || t('franchise:n_a')}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Nursery Information */}
                                <section className="p-6 bg-white border border-gray-100 !rounded-sm shadow-sm">
                                    <h4 className="text-sm font-bold text-green-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50">
                                        <Trees size={20} /> {t('franchise:nursery_details')}
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:franchise_label')}</label>
                                            <p className="text-base font-bold text-green-700 p-3 bg-green-50 rounded-sm border border-green-100">
                                                {selectedApp.nurseryName || t('franchise:n_a')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:city')}</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                                    {selectedApp.nurseryCity || t('franchise:n_a')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                                    {selectedApp.nurseryPincode || t('franchise:n_a')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nursery Description</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed italic">
                                                "{selectedApp.nurseryDescription || "No nursery description provided."}"
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('franchise:res_address')} (Nursery)</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                                {selectedApp.nurseryAddress || t('franchise:n_a')}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Documentation & Photos */}
                                <section className="md:col-span-2 p-6 bg-white border border-gray-100 !rounded-sm shadow-sm">
                                    <div className="flex flex-col md:flex-row gap-10">
                                        {/* Left: Documentation */}
                                        <div className="flex-1 flex flex-col">
                                            <h4 className="text-sm font-bold text-green-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50">
                                                <FileText size={20} /> {t('franchise:doc_identity')}
                                            </h4>
                                            <div className="flex-1 flex flex-col gap-4">
                                                <div className="p-4 bg-gray-50 rounded-sm border border-gray-100 space-y-3">
                                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('franchise:pan')}</span>
                                                        <span className="text-sm font-mono font-bold text-gray-900">{selectedApp.panNumber || t('franchise:n_a')}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('franchise:gst')}</span>
                                                        <span className="text-sm font-mono font-bold text-gray-900">{selectedApp.gstNumber || t('franchise:n_a')}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 flex-1">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{t('franchise:aadhar_front')}</p>
                                                        <div
                                                            onClick={() => selectedApp.aadharFrontUrl && setPreviewState({ isOpen: true, images: [selectedApp.aadharFrontUrl], index: 0 })}
                                                            className="cursor-zoom-in block aspect-[4/3] bg-gray-50 !rounded-sm overflow-hidden border border-gray-200 shadow-inner group relative !no-underline hover:!no-underline"
                                                        >
                                                            {selectedApp.aadharFrontUrl ? (
                                                                <img
                                                                    src={selectedApp.aadharFrontUrl}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                    alt=""
                                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                                />
                                                            ) : null}
                                                            <div className={`${selectedApp.aadharFrontUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-gray-300 flex-col gap-2 bg-gray-50`}>
                                                                <FileText size={24} className="opacity-20" />
                                                                <span className="text-[8px] font-bold uppercase text-gray-400">{t('common:no_image')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{t('franchise:aadhar_back')}</p>
                                                        <div
                                                            onClick={() => selectedApp.aadharBackUrl && setPreviewState({ isOpen: true, images: [selectedApp.aadharBackUrl], index: 0 })}
                                                            className="cursor-zoom-in block aspect-[4/3] bg-gray-50 !rounded-sm overflow-hidden border border-gray-200 shadow-inner group relative !no-underline hover:!no-underline"
                                                        >
                                                            {selectedApp.aadharBackUrl ? (
                                                                <img
                                                                    src={selectedApp.aadharBackUrl}
                                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                    alt=""
                                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                                />
                                                            ) : null}
                                                            <div className={`${selectedApp.aadharBackUrl ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-gray-300 flex-col gap-2 bg-gray-50`}>
                                                                <FileText size={24} className="opacity-20" />
                                                                <span className="text-[8px] font-bold uppercase text-gray-400">{t('common:no_image')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Nursery Photos */}
                                        <div className="flex-1 flex flex-col">
                                            <h4 className="text-sm font-bold text-green-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50">
                                                <ImageIcon size={20} /> {t('franchise:nursery_photos')}
                                            </h4>
                                            <div className="flex-1 min-h-[250px] bg-gray-50 rounded-sm border border-gray-100 overflow-hidden relative">
                                                {(() => {
                                                    const photos = getPhotos(selectedApp.nurseryPhotosJson);
                                                    if (photos.length === 1) {
                                                        return (
                                                            <div
                                                                onClick={() => setPreviewState({ isOpen: true, images: photos, index: 0 })}
                                                                className="cursor-zoom-in block w-full h-full group relative !no-underline hover:!no-underline"
                                                            >
                                                                <img
                                                                    src={photos[0]}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                    alt=""
                                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                                />
                                                                <div className="hidden w-full h-full items-center justify-center text-gray-300 flex-col gap-2 bg-gray-50">
                                                                    <ImageIcon size={32} className="opacity-20" />
                                                                    <span className="text-[10px] font-bold uppercase text-gray-400">{t('common:no_image')}</span>
                                                                </div>
                                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <p className="text-white text-xs font-bold">Zoom Nursery Photo</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (photos.length > 1) {
                                                        return (
                                                            <div className="grid grid-cols-2 gap-1 h-full">
                                                                {photos.map((url, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => setPreviewState({ isOpen: true, images: photos, index: idx })}
                                                                        className="cursor-zoom-in block h-full group overflow-hidden !no-underline hover:!no-underline"
                                                                    >
                                                                        <img
                                                                            src={url}
                                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                                            alt=""
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs italic gap-3 bg-gray-50">
                                                            <ImageIcon size={32} className="opacity-20" />
                                                            {t('common:no_image')}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedApp.nurseryLocation && (
                                            <a
                                                href={selectedApp.nurseryLocation}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center justify-between p-4 bg-green-50 rounded-sm border border-green-200 hover:bg-green-100 transition-all shadow-sm !no-underline hover:!no-underline"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white shadow-lg">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-green-700 uppercase tracking-widest">{t('franchise:view_on_maps')}</p>
                                                        <p className="text-[10px] text-green-600/70">Open GPS Coordinates In Maps</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-green-600 group-hover:translate-x-1 transition-transform">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </a>
                                        )}

                                        <div className="p-4 bg-gray-50 rounded-sm border border-gray-200 shadow-sm flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold text-gray-700 uppercase tracking-widest">{t('franchise:verification_status')}</p>
                                                <p className="text-xs text-gray-500 font-bold">
                                                    {selectedApp.verificationDate ? t('franchise:verified_on', { date: formatDate(selectedApp.verificationDate) }) : t('franchise:pending_review')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedApp.adminComments && (
                                        <div className="mt-6 p-4 bg-blue-50 rounded-sm border border-blue-100 flex gap-3">
                                            <div className="flex-shrink-0 text-blue-500 mt-1">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">{t('franchise:admin_remarks')}</p>
                                                <p className="text-sm font-medium text-blue-900 leading-relaxed italic">
                                                    "{selectedApp.adminComments}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3">
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 !rounded-sm transition-all shadow-sm"
                            >
                                {t('common:close')}
                            </button>
                            {selectedApp.status !== "approved" && (
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "approved")}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 !rounded-sm text-sm font-bold shadow-sm hover:bg-green-700 transition-all active:scale-95"
                                >
                                    <CheckCircle size={18} /> {t('common:approve')}
                                </button>
                            )}
                            {selectedApp.status !== "rejected" && (
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "rejected")}
                                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 !rounded-sm text-sm font-bold shadow-sm hover:bg-red-600 transition-all active:scale-95"
                                >
                                    <XCircle size={18} /> {t('franchise:reject')}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    handleDeleteFranchise(selectedApp.id);
                                    setSelectedApp(null);
                                }}
                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 !rounded-sm text-sm font-bold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                            >
                                <Trash2 size={18} /> {t('common:delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setFranchiseToDelete(null);
                }}
                onConfirm={confirmDeleteFranchise}
                title={t('franchise:delete_franchise_q')}
                message={t('franchise:delete_franchise_msg')}
                confirmText={t('franchise:delete_franchise_confirm')}
                itemName={franchiseToDelete?.nurseryName || franchiseToDelete?.ownerName}
                isGlobalLoading={isDeleting}
            />

            {previewState.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewState({ ...previewState, isOpen: false })}
                >
                    <button
                        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); setPreviewState({ ...previewState, isOpen: false }); }}
                    >
                        <X size={24} />
                    </button>

                    {previewState.images.length > 1 && (
                        <>
                            <button
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] active:scale-90"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewState(prev => ({
                                        ...prev,
                                        index: (prev.index - 1 + prev.images.length) % prev.images.length
                                    }));
                                }}
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] active:scale-90"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewState(prev => ({
                                        ...prev,
                                        index: (prev.index + 1) % prev.images.length
                                    }));
                                }}
                            >
                                <ChevronRight size={32} />
                            </button>
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest z-[110]">
                                {previewState.index + 1} / {previewState.images.length}
                            </div>
                        </>
                    )}

                    <div
                        className="relative w-full h-full flex items-center justify-center pointer-events-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            key={previewState.images[previewState.index]}
                            src={previewState.images[previewState.index]}
                            className="max-w-[70vw] max-h-[70vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto"
                            alt="Preview"
                            onError={(e) => {
                                e.target.src = "https://placehold.co/800x600?text=Image+Not+Found";
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
