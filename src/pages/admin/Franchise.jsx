import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    updateDoc,
    doc,
    orderBy,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import {
    Search,
    Filter,
    MapPin,
    Clock,
    PauseCircle,
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
    Building,
    Trees,
    AlertCircle,
    ClipboardList,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";

export default function AdminFranchise() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);

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

            toast.success(`Application marked as ${newStatus}`);
        } catch (e) {
            console.error("Error updating status:", e);
            toast.error("Failed to update status");
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

        return matchesSearch && matchesStatus;
    });

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
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        // Handle both number timestamps and Firestore timestamps
        if (typeof date === 'number') return new Date(date).toLocaleDateString();
        if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
        return "N/A";
    };

    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            Manage Franchise Applications
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            Review and manage franchise partnership requests
                        </p>
                    </div>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Applications"
                        value={applications.length}
                        icon={ClipboardList}
                        variant="gray"
                    />
                    <StatCard
                        title="Approved"
                        value={applications.filter(a => a.status?.toUpperCase() === 'APPROVED' || a.status?.toUpperCase() === 'ACCEPTED').length}
                        icon={CheckCircle}
                        variant="green"
                    />
                    <StatCard
                        title="Pending"
                        value={applications.filter(a => a.status?.toUpperCase() === 'PENDING' || !a.status).length}
                        icon={Clock}
                        variant="blue"
                    />
                    <StatCard
                        title="On Hold"
                        value={applications.filter(a => a.status?.toUpperCase() === 'HOLD').length}
                        icon={PauseCircle}
                        variant="amber"
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
                                placeholder="Search by name, email, nursery, or phone..."
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
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="hold">Hold</option>
                            </select>
                        </div>

                        <div className="md:col-span-4 flex justify-end items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Rows per page:</span>
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
                                <span className="text-sm text-gray-700">
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

                {/* Applications Table */}
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
                                        Applicant / Nursery
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        Applied On
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
                                        <td colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm text-gray-500 font-medium">
                                                    Loading applications...
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
                                                        {app.ownerName || "Unknown Applicant"}
                                                    </span>
                                                    <span className="text-xs text-green-600 font-semibold">
                                                        {app.nurseryName || "N/A"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-gray-900">
                                                        {app.ownerEmail || app.nurseryEmail || "N/A"}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {app.ownerPhone || app.nurseryPhone || "N/A"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(app.applicationDate)}
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(app.status)}`}>
                                                    {app.status || "pending"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-2.5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => updateStatus(app.id, "approved")}
                                                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(app.id, "hold")}
                                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-full transition-colors"
                                                        title="Hold"
                                                    >
                                                        <PauseCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(app.id, "pending")}
                                                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors"
                                                        title="Set to Pending"
                                                    >
                                                        <Clock size={18} />
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
                                                    No applications found matching your search.
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
                                Application Details
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
                                        {selectedApp.status || "PENDING"}
                                    </span>
                                    <span className="text-xs text-gray-500">Applied on {formatDate(selectedApp.applicationDate)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <section>
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User size={14} /> Personal Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 break-all">
                                                {selectedApp.ownerEmail || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                {selectedApp.ownerPhone || "N/A"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Residential Address</label>
                                            <p className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[50px]">
                                                {selectedApp.ownerAddress || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Nursery Information */}
                                <section>
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Trees size={14} /> Nursery Details
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nursery Name</label>
                                            <p className="text-base font-bold text-green-700 p-3 bg-green-50 rounded-lg border border-green-100">
                                                {selectedApp.nurseryName || "N/A"}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    {selectedApp.nurseryCity || "N/A"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">State</label>
                                                <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    {selectedApp.nurseryState || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Education / Background</label>
                                            <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-100 leading-relaxed">
                                                {selectedApp.experienceYears || "0"} years experience in nursery management.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Documentation */}
                                <section className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FileText size={14} /> Documentation & Identity
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PAN / GST</label>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                                                <p className="text-sm font-medium text-gray-900 flex justify-between">
                                                    <span className="text-gray-400">PAN:</span> {selectedApp.panNumber || "N/A"}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 flex justify-between">
                                                    <span className="text-gray-400">GST:</span> {selectedApp.gstNumber || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Aadhar Front</p>
                                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group relative">
                                                    {selectedApp.aadharFrontUrl ? (
                                                        <img src={selectedApp.aadharFrontUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Aadhar Front" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">No image</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Aadhar Back</p>
                                                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group relative">
                                                    {selectedApp.aadharBackUrl ? (
                                                        <img src={selectedApp.aadharBackUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Aadhar Back" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">No image</div>
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
                                                <MapPin size={16} /> View Nursery Location on Google Maps
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
                                    <CheckCircle size={18} /> Approve
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "hold")}
                                    className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-600 transition-all active:scale-95"
                                >
                                    <PauseCircle size={18} /> Hold
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedApp.id, "pending")}
                                    className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-50 transition-all active:scale-95"
                                >
                                    <Clock size={18} /> Pending
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
