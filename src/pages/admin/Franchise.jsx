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
    PauseCircle
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

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case "approved":
            case "accepted": return "bg-green-100 text-green-700 border-green-200";
            case "hold": return "bg-amber-100 text-amber-700 border-amber-200";
            case "pending": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "rejected": 
            case "reject": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (date) => {
        if (!date) return t('franchise:n_a');
        // Handle both number timestamps and Firestore timestamps
        if (typeof date === 'number') return new Date(date).toLocaleDateString();
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        return t('franchise:n_a');
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

                            {/* Rows Selector */}
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
                                                <div className="flex items-center justify-center">
                                                    <img
                                                        src={app.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.ownerName || "Franchise")}&background=random`}
                                                        alt={app.ownerName}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.ownerName || "Franchise")}&background=random`;
                                                        }}
                                                    />
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
                                                    <button
                                                        onClick={() => updateStatus(app.id, "approved")}
                                                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                        title={t('common:approve')}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(app.id, "rejected")}
                                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                        title={t('franchise:reject')}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="flex flex-col items-center mb-6 text-center">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-100 bg-gray-50 flex items-center justify-center mb-3">
                                    {selectedApp.profilePhotoUrl ? (
                                        <img
                                            src={selectedApp.profilePhotoUrl}
                                            alt={selectedApp.ownerName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">{selectedApp.ownerName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(selectedApp.status)}`}>
                                        {selectedApp.status || t('franchise:pending')}
                                    </span>
                                    <span className="text-xs text-gray-500">{t('franchise:applied_on')} {formatDate(selectedApp.applicationDate)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <section>
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} /> {t('franchise:personal_info')}
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:email')}</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 break-all">
                                                {selectedApp.ownerEmail || t('franchise:n_a')}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:phone')}</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                {selectedApp.ownerPhone || t('franchise:n_a')}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:res_address')}</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[50px]">
                                                {selectedApp.ownerAddress || t('franchise:n_a')}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Nursery Information */}
                                <section>
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Trees size={14} /> {t('franchise:nursery_details')}
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:franchise_label')}</label>
                                            <p className="text-base font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-100">
                                                {selectedApp.nurseryName || t('franchise:n_a')}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:city')}</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    {selectedApp.nurseryCity || t('franchise:n_a')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:state')}</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    {selectedApp.nurseryState || t('franchise:n_a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('franchise:edu_background')}</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed">
                                                {t('franchise:exp_years', { count: selectedApp.experienceYears || "0" })}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Documentation */}
                                <section className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={14} /> {t('franchise:doc_identity')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN / GST</label>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                                                <p className="text-sm font-medium text-gray-900 flex justify-between">
                                                    <span className="text-gray-400">{t('franchise:pan')}</span> {selectedApp.panNumber || t('franchise:n_a')}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 flex justify-between">
                                                    <span className="text-gray-400">{t('franchise:gst')}</span> {selectedApp.gstNumber || t('franchise:n_a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{t('franchise:aadhar_front')}</p>
                                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group relative">
                                                    {selectedApp.aadharFrontUrl ? (
                                                        <img src={selectedApp.aadharFrontUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Aadhar Front" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">{t('common:no_image')}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{t('franchise:aadhar_back')}</p>
                                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group relative">
                                                    {selectedApp.aadharBackUrl ? (
                                                        <img src={selectedApp.aadharBackUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Aadhar Back" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">{t('common:no_image')}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedApp.nurseryLocation && (
                                        <div className="mt-4">
                                            <a
                                                href={selectedApp.nurseryLocation}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-green-600 font-bold text-sm hover:underline p-3 bg-green-50 rounded-xl border border-green-100 w-full md:w-auto"
                                            >
                                                <MapPin size={16} /> {t('franchise:view_on_maps')}
                                            </a>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "approved")}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-green-700 transition-all active:scale-95"
                                >
                                    <CheckCircle size={18} /> {t('common:approve')}
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "hold")}
                                    className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-600 transition-all active:scale-95"
                                >
                                    <PauseCircle size={18} /> {t('franchise:on_hold')}
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "pending")}
                                    className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-50 transition-all active:scale-95"
                                >
                                    <Clock size={18} /> {t('franchise:pending')}
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteFranchise(selectedApp.id);
                                        setSelectedApp(null);
                                    }}
                                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-red-700 transition-all active:scale-95"
                                >
                                    <Trash2 size={18} /> {t('common:delete')}
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                            >
                                {t('common:close')}
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
        </div>
    );
}
