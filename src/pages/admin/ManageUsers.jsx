import { useEffect, useState } from "react";
import {
  addDoc,
  serverTimestamp,
  where,
  collection,
  getDocs,
  query,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { initializeApp, deleteApp } from "firebase/app";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, auth, storage, functions } from "../../lib/firebase";
import { ROLES } from "../../utils/roles";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Trees,
  Building,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Calendar,
  Clock,

  Eye,
  EyeOff,
  Users as UsersIcon,
  UserCheck,
  UserX,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

// Keep dummy users if database is empty or fetch fails


export default function UsersManage() {
  const { t } = useTranslation(['users', 'common']);
  const [users, setUsers] = useState([]);
  const [nurseries, setNurseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false); // For View Modal
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    userName: "",
    phone: "",
    email: "",
    address: "",
    nurseryId: "",
    nurseryName: "",
    password: "",
    status: "active",
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, statusFilter]);

  useEffect(() => {
    setLoading(true);

    // Listen to Users
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const realUsers = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds
              ? a.createdAt.seconds * 1000
              : new Date(a.createdAt || 0).getTime();
            const dateB = b.createdAt?.seconds
              ? b.createdAt.seconds * 1000
              : new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        setUsers(realUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to users:", error);
        toast.error(t('users:modals.validation.sync_error'));
        setLoading(false);
      }
    );

    // Listen to Nurseries (Owners)
    const nurseriesQuery = query(collection(db, "franchise"));
    const unsubscribeNurseries = onSnapshot(
      nurseriesQuery,
      (snapshot) => {
        const nurseriesList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setNurseries(nurseriesList);
      },
      (error) => {
        console.error("Error listening to nurseries:", error);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeNurseries();
    };
  }, []);



  const handleOpenModal = () => {
    setFormData({
      userName: "",
      phone: "",
      email: "",
      address: "",
      nurseryId: "",
      nurseryName: "",
      password: "",
      status: "active",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditId(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleEdit = (user, e) => {
    e.stopPropagation();
    setFormData({
      userName: user.userName || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
      nurseryId: "", // Not used in UI currently but kept for structure
      nurseryName: "",
      password: "", // Not populated
      status: user.status || "active",
    });
    setImagePreview(user.profileImage || null);
    setEditId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (user, e) => {
    e.stopPropagation();
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);

      const targetUid = userToDelete.uid || userToDelete.id;

      // 1. Delete from Firebase Authentication via Cloud Function
      await toast.promise(
        (async () => {
          const deleteAuthFn = httpsCallable(functions, "deleteUserAuth");
          const result = await deleteAuthFn({ uid: targetUid });

          if (!result.data.success) {
            throw new Error(result.data.message || "Failed to delete from Auth");
          }
          return result.data;
        })(),
        {
          loading: t('users:toast.auth_cleanup'),
          success: (data) => data.message || t('users:toast.auth_success'),
          error: (err) => `Auth cleanup failed: ${err.message}`,
        }
      );

      // 2. Delete Profile Image from Storage (if applicable)
      if (userToDelete.profileImage && userToDelete.profileImage.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, userToDelete.profileImage);
          await deleteObject(imageRef);
          console.log("Profile image deleted from Storage");
        } catch (storageError) {
          console.error("Error deleting profile image from Storage:", storageError);
          // We continue even if image deletion fails
        }
      }

      // 3. Delete from Firestore
      await deleteDoc(doc(db, "users", userToDelete.id));

      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success(t('users:toast.firestore_success'));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      // We don't automatically delete Firestore doc if auth fails because the user
      // would see the "record deleted" success but the credentials would remain.
      // This way it's safer.
      toast.error(t('users:modals.validation.delete_confirm'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.toLowerCase() }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.userName ||
      !formData.email
    ) {
      toast.error(t('users:modals.validation.required'));
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error(t('users:modals.validation.pass_required'));
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      toast.error(t('users:modals.validation.pass_format'));
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error(t('users:modals.validation.phone_format'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error(t('users:modals.validation.email_format'));
      return;
    }

    try {
      setSubmitting(true);

      let imageUrl = imagePreview; // Default to existing preview

      // Upload Image if selected
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const storageRef = ref(storage, `profiles/users/${formData.email}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (isEditing) {
        // Update Logic
        await updateDoc(doc(db, "users", editId), {
          userName: formData.userName,
          phone: formData.phone || "",
          email: formData.email,
          address: formData.address || "",
          profileImage: imageUrl,
          ...(formData.password ? { password: formData.password } : {}), // Update password if provided
          updatedAt: serverTimestamp(),
          status: formData.status,
        });

        toast.success(t('users:toast.edit_success'));
        // Update local state is tricky because 'users' might need refresh, but we can optimistically update
        setUsers(prev => prev.map(u => u.id === editId ? {
          ...u,
          userName: formData.userName,
          phone: formData.phone || "",
          email: formData.email,
          address: formData.address || "",
          profileImage: imageUrl,
          ...(formData.password ? { password: formData.password } : {}),
          updatedAt: { seconds: Date.now() / 1000 },
          status: formData.status,
        } : u));

      } else {
        // Create Logic
        // Initialize a secondary app to create user without logging out the current admin
        const secondaryApp = initializeApp(auth.app.options, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          formData.email.trim(),
          formData.password
        );

        const userId = userCredential.user.uid;

        // Immediately sign out the secondary user to be safe
        await signOut(secondaryAuth);

        // Create user document
        await setDoc(doc(db, "users", userId), {
          uid: userId,
          userName: formData.userName,
          phone: formData.phone || "",
          email: formData.email,
          address: formData.address || "",
          profileImage: imageUrl,
          password: formData.password, // Store password
          role: ROLES.USER,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: formData.status || "active",
        });

        toast.success(t('users:toast.add_success'));
      }

      handleCloseModal();

    } catch (error) {
      console.error("Error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already in use");
      } else {
        toast.error(t('users:toast.add_error') || "Failed to add user");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.userName && u.userName.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "active" ? (u.status || "active") === "active" :
        statusFilter === "inactive" ? u.status === "inactive" :
          true;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "name-asc") return (a.userName || "").localeCompare(b.userName || "");
    if (sortBy === "name-desc") return (b.userName || "").localeCompare(a.userName || "");

    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="font-sans min-h-screen p-0 pt-3">
      <div className="w-full px-4 py-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
              {t('users:title')}
            </h3>
            <p className="text-base text-gray-600 font-normal mb-0">
              {t('users:subtitle')}
            </p>
          </div>
        </div>
        <hr className="mt-4 mb-5 border-gray-100" />

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title={t('users:stats.total')}
            value={users.length}
            icon={UsersIcon}
            variant="gray"
          />
          <StatCard
            title={t('users:stats.active')}
            value={users.filter(u => u.status === 'active').length}
            icon={UserCheck}
            variant="green"
          />
          <StatCard
            title={t('users:stats.inactive')}
            value={users.filter(u => u.status === 'inactive').length}
            icon={UserX}
            variant="red"
          />
          <StatCard
            title={t('users:stats.staff')}
            value={users.filter(u => u.role === ROLES.ADMIN || u.role === ROLES.STAFF).length}
            icon={ShieldCheck}
            variant="blue"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-lg font-bold text-gray-900">{t('users:filters.title')}</h5>
            <div className="text-sm font-medium text-gray-500">
              {t('users:filters.records_count', { count: filteredUsers.length })}
            </div>
          </div>
          <hr className="mt-0 mb-4 border-gray-200" />

          <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
            {/* Row 1: Search Bar */}
            <div className="w-full flex flex-col gap-1.5 xl:flex-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('users:filters.search_label')}</label>
              <div className="relative group">
                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('users:filters.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-gray-700 bg-gray-50/30"
                />
              </div>
            </div>

            {/* Row 2: Filters Grid */}
            <div className="grid grid-cols-2 lg:flex lg:flex-row items-end gap-3 w-full xl:w-auto">
              {/* Status Filter First */}
              <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[130px]">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('users:filters.status')}</label>
                <div className="relative group">
                  <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                  >
                    <option value="all">{t('common:all')}</option>
                    <option value="active">{t('users:modals.status_active')}</option>
                    <option value="inactive">{t('users:modals.status_inactive')}</option>
                  </select>
                </div>
              </div>

              {/* Sort Filter Second */}
              <div className="flex flex-col gap-1.5 col-span-1 lg:flex-none lg:w-[130px]">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('users:filters.sort_by')}</label>
                <div className="relative group">
                  <Filter className="absolute text-gray-400 left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-8 pr-2 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all appearance-none cursor-pointer bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                  >
                    <option value="newest">{t('common:newest')}</option>
                    <option value="name-asc">{t('common:name_asc')}</option>
                    <option value="name-desc">{t('common:name_desc')}</option>
                  </select>
                </div>
              </div>

              {/* Rows Selector */}
              <div className="flex flex-col gap-1.5 col-span-2 lg:flex-none lg:w-[100px]">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('users:filters.rows')}</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 transition-all text-center"
                >
                  {[10, 25, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              {/* ... table content remains same ... */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.sr_no')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.image')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.reg_date')}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.status')}
                  </th>

                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('users:table.action')}
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
                          {t('users:table.loading')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedUsers.length ? (
                  paginatedUsers.map((u, index) => {
                    const displayName = u.name || u.displayName || u.fullName || u.userName || t('common:unknown_user');
                    const displayEmail = u.email || t('common:no_email');

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
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
                            {u.profileImage ? (
                              <img src={u.profileImage} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full bg-slate-100">
                                <User size={18} className="text-slate-400" />
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900" title={displayName}>
                              {displayName.length > 20 ? displayName.substring(0, 20) + "..." : displayName}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-900" title={displayEmail}>
                              {displayEmail.length > 25 ? displayEmail.substring(0, 25) + "..." : displayEmail}
                            </span>
                            {u.phone && (
                              <span className="text-xs text-gray-500 font-mono">
                                {u.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {u.createdAt?.seconds
                              ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-GB')
                              : u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString('en-GB')
                                : t('common:n_a')}
                          </span>
                        </td>

                        <td className="px-6 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(u.status || "active") === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {(u.status || "active") === "active" ? t('users:modals.status_active') : t('users:modals.status_inactive')}
                          </span>
                        </td>

                        <td className="px-6 py-2.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => handleEdit(u, e)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                              title={t('users:tooltips.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(u, e)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                              title={t('users:tooltips.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                          <User size={32} className="opacity-50" />
                        </div>
                        <p className="text-sm font-medium">
                          {t('users:table.no_results')}
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
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <span className="text-base font-medium text-gray-500 whitespace-nowrap">
                {t('common:pagination', { current: currentPage, total: Math.max(1, totalPages) })}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>




        {/* Tailwind Modal */}
        {
          showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={handleCloseModal}
              ></div>
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="text-green-600" size={24} />
                    {isEditing ? t('users:modals.edit_title') : t('users:modals.add_title')}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[80vh] relative">
                  {/* Status Toggle Top Right */}
                  <div className="absolute top-6 right-6 z-10 flex flex-col items-center gap-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === "active"}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? "active" : "inactive" }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span className={`text-xs font-semibold ${formData.status === "active" ? "text-green-600" : "text-gray-400"}`}>
                      {formData.status === "active" ? t('users:modals.status_active') : t('users:modals.status_inactive')}
                    </span>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-100 bg-gray-50 flex items-center justify-center">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <User size={32} className="text-gray-400" />
                          )}
                        </div>

                        {/* Status Dot (Bottom Right) */}
                        <div className={`absolute bottom-0 right-1 w-5 h-5 rounded-full border-2 border-white ${formData.status === "active" ? "bg-green-500" : "bg-gray-400"}`}></div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <span className="text-white text-xs font-medium">Change</span>
                        </label>
                      </div>
                      {imagePreview ? (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="text-xs text-red-500 mt-2 hover:text-red-700 font-medium"
                        >
                          {t('common:remove')}
                        </button>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">{t('users:modals.fields.profile_image')}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-green-600" />
                          <label className="text-base font-medium text-gray-700">
                            {t('users:modals.fields.name')} <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          name="userName"
                          value={formData.userName}
                          onChange={handleInputChange}
                          placeholder={t('users:modals.placeholders.name')}
                          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
                          disabled={submitting}
                          required
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-orange-600" />
                          <label className="text-base font-medium text-gray-700">
                            {t('users:modals.fields.phone')}
                          </label>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder={t('users:modals.placeholders.phone')}
                          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
                          disabled={submitting}
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-red-600" />
                          <label className="text-base font-medium text-gray-700">
                            {t('users:modals.fields.address')}
                          </label>
                        </div>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder={t('users:modals.placeholders.address')}
                          rows={3}
                          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400 resize-none"
                          disabled={submitting}
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-purple-600" />
                          <label className="text-base font-medium text-gray-700">
                            {t('users:modals.fields.email')} <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder={t('users:modals.placeholders.email')}
                          className="w-full px-3 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
                          disabled={submitting}
                          required
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-gray-400" />
                          <label className="text-base font-medium text-gray-700">
                            {t('users:modals.fields.password')} <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={isEditing ? "(Leave blank to keep current)" : t('users:modals.placeholders.password')}
                            className="w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
                            disabled={submitting}
                            required={!isEditing}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {isEditing && (
                          <p className="text-xs text-gray-500">
                            Only enter if you defined to change the password
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm border border-transparent font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{isEditing ? t('common:saving') : t('common:adding')}</span>
                      </>
                    ) : (
                      <>

                        <span>{isEditing ? t('common:update') : t('common:add')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* View User Modal */}
        {
          selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-24 md:py-32">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => {
                  setSelectedUser(null);
                  setShowViewPassword(false);
                }}
              ></div>
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="text-green-600" size={24} />
                    {t('users:modals.view_title')}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setShowViewPassword(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 transition-colors"
                    style={{ borderRadius: "12px" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {selectedUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-28 md:py-32">
                    <div
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                      onClick={() => setSelectedUser(null)}
                    ></div>
                    <div className="relative bg-white !rounded-sm shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                      {/* Modal Header */}
                      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white z-10">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <UserCheck className="text-green-600" size={24} />
                          {t('users:modals.details_title', 'User Details')}
                        </h3>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Modal Body with Hero */}
                      <div className="overflow-y-auto max-h-[75vh] bg-gray-50/50">
                        {/* Hero Header Section */}
                        <div className="h-64 relative overflow-hidden group">
                          <div className="absolute inset-0 z-0">
                            <img src="/loginbg.jpg" className="w-full h-full object-cover scale-105 transition-transform duration-700 group-hover:scale-100" alt="" />
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

                            {/* Decorative Elements */}
                            <div className="absolute top-6 left-8 opacity-20 pointer-events-none">
                              <div className="grid grid-cols-5 gap-2">
                                {[...Array(15)].map((_, i) => (
                                  <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="relative mb-4">
                              <div className="w-32 h-32 rounded-full border-4 border-white/20 p-1 backdrop-blur-sm overflow-hidden bg-white/10 shadow-2xl flex items-center justify-center">
                                {selectedUser.profileImage ? (
                                  <img
                                    src={selectedUser.profileImage}
                                    className="w-full h-full rounded-full object-cover"
                                    alt=""
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.userName || "")}&background=random`;
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full bg-black/40 rounded-full">
                                    <User size={56} className="text-white/80" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <h4 className="text-2xl font-black text-white mb-2 tracking-tight">
                              {selectedUser.userName || t('common:unknown_user')}
                            </h4>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${(selectedUser.status || "active") === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                                {(selectedUser.status || "active") === "active" ? t('users:modals.status_active') : t('users:modals.status_inactive')}
                              </span>
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/80 text-[10px] font-bold uppercase tracking-widest">
                                <Calendar size={12} className="text-white/60" />
                                {t('users:table.joined')} {selectedUser.createdAt?.seconds ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Header Bottom Bar */}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
                        </div>

                        <div className="p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Personal Info Card */}
                            <div className="p-6 bg-white border border-gray-100 !rounded-sm shadow-sm hover:shadow-md transition-shadow">
                              <h4 className="text-sm font-bold text-green-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50 uppercase ">
                                <User size={20} /> {t('users:modals.sections.personal', 'Personal Information')}
                              </h4>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:modals.fields.email')}</label>
                                  <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                    {selectedUser.email || t('common:n_a')}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:modals.fields.phone', 'Phone Number')}</label>
                                  <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                    {selectedUser.phone || t('common:n_a')}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:modals.fields.password', 'Login Password')}</label>
                                  <div className="relative">
                                    <div className="w-full p-3 text-sm font-mono font-medium border border-gray-100 rounded-sm bg-gray-50 text-gray-900">
                                      {showViewPassword ? (selectedUser.password || t('common:n_a')) : "••••••••••••"}
                                    </div>
                                    <button
                                      onClick={() => setShowViewPassword(!showViewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                      {showViewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Location & Activity Card */}
                            <div className="p-6 bg-white border border-gray-100 !rounded-sm shadow-sm hover:shadow-md transition-shadow">
                              <h4 className="text-sm font-bold text-orange-600 mb-6 flex items-center gap-2 pb-2 border-b border-gray-50 uppercase">
                                <MapPin size={20} /> {t('users:modals.sections.location', 'Location & Activity')}
                              </h4>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:modals.fields.address')}</label>
                                  <p className="text-sm font-medium text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100 min-h-[5.5rem] whitespace-pre-wrap">
                                    {selectedUser.address || t('common:n_a')}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:table.joined')}</label>
                                    <p className="text-[11px] font-bold text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                      {selectedUser.createdAt?.seconds ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('users:table.last_updated', 'Last Update')}</label>
                                    <p className="text-[11px] font-bold text-gray-900 p-3 bg-gray-50 rounded-sm border border-gray-100">
                                      {selectedUser.updatedAt?.seconds ? new Date(selectedUser.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setShowViewPassword(false);
                          }}
                          className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 !rounded-sm transition-all shadow-sm active:scale-95"
                        >
                          {t('common:close')}
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(selectedUser, { stopPropagation: () => { } });
                            setSelectedUser(null);
                          }}
                          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 !rounded-sm text-sm font-black shadow-lg hover:bg-red-700 transition-all active:scale-95"
                        >
                          <Trash2 size={18} /> {t('common:delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDelete}
          title={t('users:modals.validation.delete_title') || "Delete User Account?"}
          message={t('users:modals.validation.delete_msg') || "This action cannot be undone. This will permanently delete the user's profile and remove their access to the system."}
          confirmText={t('common:delete_confirm') || "DELETE USER"}
          itemName={userToDelete?.userName || userToDelete?.email}
          isGlobalLoading={isDeleting}
        />
      </div>
    </div>
  );
}
