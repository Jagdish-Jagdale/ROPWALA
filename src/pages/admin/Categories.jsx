import { useEffect, useState } from "react";
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [sortBy, setSortBy] = useState("newest");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);

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
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted");
      fetchCategories();
      setShowDeleteModal(false);
    } catch (e) {
      toast.error("Failed to delete category");
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
              Manage Categories
            </h3>
            <p className="text-base text-gray-600 font-normal mb-0">
              Add and manage product categories
            </p>
          </div>
        </div>
        <hr className="mt-4 mb-5 border-gray-100" />

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Categories"
            value={categories.length}
            icon={Grid}
            variant="gray"
          />
          <StatCard
            title="Active"
            value={categories.filter((c) => c.status === "active").length}
            icon={CheckCircle}
            variant="green"
          />
          <StatCard
            title="Inactive"
            value={categories.filter((c) => c.status === "inactive").length}
            icon={X}
            variant="red"
          />
          <StatCard
            title="Popular"
            value={categories.length > 0 ? "Top 5" : 0}
            icon={Plus}
            variant="blue"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h5 className="text-xs font-semibold text-gray-900">
              Search & Filters
            </h5>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-all shadow-sm text-sm"
              style={{ borderRadius: "12px" }}
            >
              <Plus size={18} />
              <span>Add Category</span>
            </button>
          </div>
          <hr className="mt-0 mb-4 border-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <div className="md:col-span-8 relative">
              <Search
                className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2"
                size={18}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by category name..."
                className="w-full pl-10 pr-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            <div className="md:col-span-4 relative">
              <Filter
                className="absolute text-gray-400 left-3 top-1/2 -translate-y-1/2"
                size={16}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none cursor-pointer bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
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
                    Sr No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Sub-categories
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[160px]">
                    Add Sub-categories
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
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
                        ? "Loading categories..."
                        : "No categories found."}
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
                  {selectedCategory ? "Edit Category" : "Add New Category"}
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
                    Category Name
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
                    placeholder="e.g. Indoor Plants"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 transition-all shadow-md disabled:bg-green-400 font-sans"
                    style={{ borderRadius: "12px" }}
                  >
                    {submitting ? "Saving..." : "Save Category"}
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
                  Category Details
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
                    Category Name
                  </label>
                  <p className="text-lg font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedCategory.name}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Sub-Categories
                    </label>
                    <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                      {selectedCategory.subcategories?.length || 0} Total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedCategory.subcategories &&
                      selectedCategory.subcategories.length > 0 ? (
                      selectedCategory.subcategories.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-green-200 hover:bg-green-50/30 transition-all group"
                          title={sub.name}
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {sub.name?.length > 20
                              ? sub.name.substring(0, 20) + "..."
                              : sub.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono italic">
                            Sub-{String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                          No subcategories found.
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
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {isSubModalOpen && selectedCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-center border border-gray-100">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-200/50">
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      Add Sub-category
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Create a nested items list
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
                className="p-6 space-y-5"
              >
                <div className="space-y-4">
                  <div className="bg-green-50/50 border border-green-100/50 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Grid size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-0.5">
                        Adding to category
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
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Sub-category Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none bg-gray-50/30 placeholder:text-gray-400"
                        placeholder="e.g. Exotic Ferns"
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
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    style={{ borderRadius: "12px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSub}
                    className="flex-1 px-4 py-3 bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-md shadow-green-200 disabled:bg-green-400 text-sm flex items-center justify-center gap-2"
                    style={{ borderRadius: "12px" }}
                  >
                    {submittingSub ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>Add Sub-category</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => handleDelete(categoryToDelete?.id)}
        />
      </div>
    </div>
  );
}
