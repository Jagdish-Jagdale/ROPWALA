import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  collection,
  getDocs,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Grid,
  MoreVertical,
  CheckCircle,
  X,
  Filter,
} from "lucide-react";
import StatCard from "../../components/common/StatCard";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";

export default function AdminCategories() {
  const { t } = useTranslation(['category', 'common']);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [sortBy, setSortBy] = useState("newest");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);

  const [isSubEditModalOpen, setIsSubEditModalOpen] = useState(false);
  const [subToEdit, setSubToEdit] = useState(null);
  const [editSubName, setEditSubName] = useState("");
  const [submittingEditSub, setSubmittingEditSub] = useState(false);
  const [showSubDeleteModal, setShowSubDeleteModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    status: "active",
    order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "categories"), orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);
      const data = await Promise.all(
        querySnapshot.docs.map(async (d) => {
          const categoryData = { id: d.id, ...d.data() };
          // Fetch sub-categories subcollection
          const subCategoriesRef = collection(
            db,
            "categories",
            d.id,
            "sub-categories",
          );
          const subSnapshot = await getDocs(
            query(subCategoriesRef, orderBy("createdAt", "asc")),
          );
          categoryData.subcategories = subSnapshot.docs.map((sd) => ({
            id: sd.id,
            ...sd.data(),
          }));
          return categoryData;
        }),
      );
      setCategories(data);
    } catch (e) {
      console.error("Error fetching categories:", e);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        status: category.status || "active",
        order: category.order || 0,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: "",
        slug: "",
        status: "active",
        order: categories.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSave = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (selectedCategory) {
        await updateDoc(doc(db, "categories", selectedCategory.id), dataToSave);
        toast.success("Category updated successfully");
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, "categories"), dataToSave);
        toast.success("Category added successfully");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (e) {
      console.error("Error saving category:", e);
      toast.error("Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted");
      fetchCategories();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (e) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSubCategory = async (e) => {
    e.preventDefault();
    if (!editSubName.trim() || !subToEdit || !selectedCategory) return;
    setSubmittingEditSub(true);
    try {
      const subDocRef = doc(
        db,
        "categories",
        selectedCategory.id,
        "sub-categories",
        subToEdit.id,
      );
      await updateDoc(subDocRef, {
        name: editSubName.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Sub-category updated");
      setIsSubEditModalOpen(false);
      // Update local state to reflect change without full fetch if possible, 
      // but fetchCategories is safer given the nested structure
      fetchCategories();
      
      // Also update selectedCategory for the View Modal
      const updatedSubcategories = selectedCategory.subcategories.map(s => 
        s.id === subToEdit.id ? { ...s, name: editSubName.trim() } : s
      );
      setSelectedCategory({ ...selectedCategory, subcategories: updatedSubcategories });
    } catch (err) {
      console.error("Error updating sub-category:", err);
      toast.error("Failed to update sub-category");
    } finally {
      setSubmittingEditSub(false);
    }
  };

  const handleDeleteSubCategory = async () => {
    if (!subToDelete || !selectedCategory) return;
    try {
      setIsDeleting(true);
      const subDocRef = doc(
        db,
        "categories",
        selectedCategory.id,
        "sub-categories",
        subToDelete.id,
      );
      await deleteDoc(subDocRef);
      toast.success("Sub-category deleted");
      setShowSubDeleteModal(false);
      setSubToDelete(null);
      fetchCategories();
      
      // Also update selectedCategory for the View Modal
      const updatedSubcategories = selectedCategory.subcategories.filter(s => s.id !== subToDelete.id);
      setSelectedCategory({ ...selectedCategory, subcategories: updatedSubcategories });
    } catch (err) {
      console.error("Error deleting sub-category:", err);
      toast.error("Failed to delete sub-category");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "newest")
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === "oldest")
        return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="font-sans min-h-screen p-0 pt-3">
      <div className="w-full px-4 py-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
              {t('category:manage_categories')}
            </h3>
            <p className="text-base text-gray-600 font-normal mb-0">
              {t('category:manage_desc')}
            </p>
          </div>
        </div>
        <hr className="mt-4 mb-5 border-gray-100" />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title={t('category:total_categories')}
            value={categories.length}
            icon={Grid}
            variant="gray"
          />
          <StatCard
            title={t('category:active')}
            value={categories.filter((c) => c.status === "active").length}
            icon={CheckCircle}
            variant="green"
          />
          <StatCard
            title={t('category:inactive')}
            value={categories.filter((c) => c.status === "inactive").length}
            icon={X}
            variant="red"
          />
          <StatCard
            title={t('common:popular')}
            value={categories.length > 0 ? "Top 5" : 0}
            icon={Plus}
            variant="blue"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h5 className="text-lg font-bold text-gray-900">{t('common:search_filters')}</h5>
              <div className="text-sm font-medium text-gray-500">
                {t('common:total_records', { count: filteredCategories.length })}
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-all shadow-sm text-sm"
              style={{ borderRadius: "12px" }}
            >
              <Plus size={18} />
              <span>{t('category:add_category')}</span>
            </button>
          </div>
          <hr className="mt-0 mb-4 border-gray-200" />
          <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
            {/* Row 1: Search Bar */}
            <div className="w-full flex flex-col gap-1.5 xl:flex-1">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('category:search_placeholder')}</label>
              <div className="relative group">
                <Search className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('category:search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-medium text-gray-700 bg-gray-50/30"
                />
              </div>
            </div>

            {/* Row 2: Filters Grid */}
            <div className="flex justify-start w-full xl:w-auto">
              <div className="flex flex-col gap-1.5 w-full sm:w-[200px]">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{t('common:sort_by', 'Sort By')}</label>
                <div className="relative group">
                  <Filter className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-green-600 transition-colors" size={14} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 cursor-pointer appearance-none bg-gray-50/30 font-semibold text-gray-700 uppercase tracking-tight"
                  >
                    <option value="newest">{t('common:newest_first')}</option>
                    <option value="oldest">{t('common:oldest_first')}</option>
                    <option value="name">{t('common:name_az')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100 font-sans">
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                    {t('category:sr_no')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('category:category_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('category:subcategories')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                    {t('category:add_subcategory')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('category:actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category, index) => (
                    <tr
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsViewModalOpen(true);
                      }}
                      className="bg-white hover:bg-green-50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100 text-center">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap border-b border-gray-100">
                        <span
                          className="text-sm font-bold text-gray-900"
                          title={category.name}
                        >
                          {category.name?.length > 20
                            ? category.name.substring(0, 20) + "..."
                            : category.name}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 border-b border-gray-100">
                        <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] text-gray-600">
                          {category.subcategories?.length || 0} items
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center border-b border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                            setIsSubModalOpen(true);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-600 hover:text-white transition-all border border-green-200 hover:border-green-600 shadow-sm mx-auto group/sub"
                          style={{ borderRadius: "50%" }}
                          title="Add Subcategory"
                        >
                          <Plus
                            size={14}
                            className="transition-transform group-hover/sub:scale-110"
                          />
                        </button>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center border-b border-gray-100">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(category);
                            }}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors border border-green-100"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(category);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors border border-red-100"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500 font-medium whitespace-nowrap"
                    >
                      {loading
                        ? t('common:loading')
                        : t('category:no_categories')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Category Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCategory ? t('category:edit_category') : t('category:add_new_category')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t('category:form_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: name
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^\w-]+/g, ""),
                        status: formData.status || "active",
                        order: formData.order || 0,
                      });
                    }}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    style={{ borderRadius: "8px" }}
                    placeholder={t('category:name_placeholder')}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 transition-all shadow-md disabled:bg-green-400 font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    {submitting ? t('category:adding') : t('category:add_category')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Category Details Modal */}
        {isViewModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-in-center">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Grid className="text-green-600" size={24} />
                  {t('category:category_details')}
                </h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {t('category:category_name')}
                  </label>
                  <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedCategory.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('category:subcategories')}
                    </label>
                    <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                      {t('category:total_items', { count: selectedCategory.subcategories?.length || 0 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedCategory.subcategories &&
                      selectedCategory.subcategories.length > 0 ? (
                      selectedCategory.subcategories.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-green-200 hover:bg-green-50/10 transition-all group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]" title={sub.name}>
                              {sub.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono italic">
                              Sub-{String(idx + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubToEdit(sub);
                                setEditSubName(sub.name);
                                setIsSubEditModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Sub-category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubToDelete(sub);
                                setShowSubDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Sub-category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          {t('category:no_subcategories')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                  style={{ borderRadius: "12px" }}
                >
                  {t('category:close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {isSubModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center border border-gray-100">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-200/50">
                    <Plus size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 leading-tight">
                      {t('category:add_subcategory')}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {t('category:create_nested_list')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSubModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!subName.trim()) return;
                  setSubmittingSub(true);
                  try {
                    const subCategoriesRef = collection(
                      db,
                      "categories",
                      selectedCategory.id,
                      "sub-categories",
                    );
                    await addDoc(subCategoriesRef, {
                      name: subName.trim(),
                      createdAt: serverTimestamp(),
                    });
                    toast.success("Sub-category added");
                    setSubName("");
                    setIsSubModalOpen(false);
                    fetchCategories();
                  } catch (err) {
                    toast.error("Failed to add sub-category");
                  } finally {
                    setSubmittingSub(false);
                  }
                }}
                className="p-3 space-y-2"
              >
                <div className="">
                  <div className="bg-green-50/50 border border-green-100/50 p-2 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Grid size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-0.5">
                        {t('category:adding_to_category')}
                      </p>
                      <p
                        className="text-sm font-bold text-gray-900 truncate"
                        title={selectedCategory.name}
                      >
                        {selectedCategory.name?.length > 30
                          ? selectedCategory.name.substring(0, 30) + "..."
                          : selectedCategory.name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide my-3">
                      {t('category:subcategory_name')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none bg-gray-50/30 placeholder:text-gray-400"
                        placeholder={t('category:sub_name_placeholder')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                        <Edit2 size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(false)}
                    className="flex-1 px-2 py-2 bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    style={{ borderRadius: "12px" }}
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSub}
                    className="flex-1 px-2 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 disabled:bg-green-400 text-sm flex items-center justify-center gap-2"
                    style={{ borderRadius: "12px" }}
                  >
                    {submittingSub ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('category:adding')}</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>{t('category:add_subcategory')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subcategory Modal */}
        {isSubEditModalOpen && subToEdit && selectedCategory && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center border border-gray-100">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-200/50">
                    <Edit2 size={14} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 leading-tight">
                      {t('category:edit_subcategory')}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {t('category:update_nested_name')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSubEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateSubCategory} className="p-3 space-y-2">
                <div className="">
                  <div className="bg-green-50/50 border border-green-100/50 p-2 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Grid size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-0.5">
                        {t('category:category_context')}
                      </p>
                      <p
                        className="text-sm font-bold text-gray-900 truncate"
                        title={selectedCategory.name}
                      >
                        {selectedCategory.name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide my-3">
                      Sub-category Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={editSubName}
                        onChange={(e) => setEditSubName(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none bg-gray-50/30 placeholder:text-gray-400"
                        placeholder={t('category:sub_name_placeholder')}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                        <Edit2 size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubEditModalOpen(false)}
                    className="flex-1 px-2 py-2 bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    style={{ borderRadius: "12px" }}
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEditSub}
                    className="flex-1 px-2 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 disabled:bg-green-400 text-sm flex items-center justify-center gap-2"
                    style={{ borderRadius: "12px" }}
                  >
                    {submittingEditSub ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('category:updating')}</span>
                      </>
                    ) : (
                      <>
                        <Edit2 size={18} />
                        <span>{t('common:update')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={showSubDeleteModal}
          onClose={() => setShowSubDeleteModal(false)}
          onConfirm={handleDeleteSubCategory}
          title={t('category:delete_subcategory_q')}
          itemName={subToDelete?.name}
          confirmText={t('category:delete')}
          isGlobalLoading={isDeleting}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(categoryToDelete?.id)}
          title={t('category:delete_category_q')}
          itemName={categoryToDelete?.name}
          confirmText={t('category:delete')}
          isGlobalLoading={isDeleting}
        />
      </div>
    </div>
  );
}
