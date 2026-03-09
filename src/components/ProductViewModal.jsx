import { useState, useEffect } from "react";
import { Package, X, Star, Calendar, Box, Tag, User, MapPin } from "lucide-react";

export default function ProductViewModal({ isOpen, onClose, product }) {
    const [selectedImage, setSelectedImage] = useState("");

    // Reset selected image when modal opens or product changes
    useEffect(() => {
        if (product) {
            if (product.imageUrls && product.imageUrls.length > 0) {
                setSelectedImage(product.imageUrls[0]);
            } else if (product.imageUrl) {
                setSelectedImage(product.imageUrl);
            } else {
                setSelectedImage("");
            }
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const imagesList = product.imageUrls?.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content - Spacious & Professional */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 sticky top-0">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-green-600" size={24} />
                        Product Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1 p-6 lg:p-8">
                    {/* Main Layout Grid */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">

                        {/* LEFT SECTION: Images (Thumbnails + Main Image) */}
                        <div className="w-full lg:w-[60%] flex gap-4">
                            {/* Vertical Thumbnail Rail */}
                            {imagesList.length > 0 && (
                                <div className="hidden sm:flex flex-col gap-3 min-w-[60px] max-h-[500px] overflow-y-auto custom-scrollbar pr-1 pb-4">
                                    {imagesList.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(url)}
                                            className={`w-[60px] h-[60px] rounded object-cover border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${selectedImage === url ? 'border-green-600 shadow-md ring-1 ring-green-500 ring-offset-1' : 'border-gray-200 hover:border-green-400 opacity-70 hover:opacity-100'}`}
                                            onMouseEnter={() => setSelectedImage(url)} // Amazon behavior: Hover changes image
                                        >
                                            <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Image Viewport - Adjusted height for better balance */}
                            <div className="flex-1">
                                <div className="w-full aspect-square rounded-lg border border-gray-100 overflow-hidden relative group bg-white flex items-center justify-center p-4 hover:border-gray-200 transition-colors shadow-sm">
                                    {selectedImage ? (
                                        <img
                                            src={selectedImage}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x600?text=No+Image";
                                            }}
                                        />
                                    ) : (
                                        <Package size={80} className="text-gray-200" />
                                    )}

                                    {/* Status Badge Over Image */}
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-sm text-[11px] font-bold border uppercase tracking-widest shadow-sm ${product.status === "approved" || product.status === "active" || product.status === "Available" ? "bg-green-600 text-white border-green-700" :
                                            product.status === "pending" ? "bg-blue-600 text-white border-blue-700" :
                                                "bg-red-600 text-white border-red-700"
                                            }`}>
                                            {product.status || "pending"}
                                        </span>
                                    </div>
                                </div>

                                {/* Mobile Horizontal Thumbnails */}
                                {imagesList.length > 0 && (
                                    <div className="flex sm:hidden gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {imagesList.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImage(url)}
                                                className={`w-14 h-14 rounded object-cover border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${selectedImage === url ? 'border-green-600 shadow-sm' : 'border-gray-200 opacity-70'}`}
                                            >
                                                <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain p-1" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Information Column */}
                        <div className="w-full lg:w-[40%] flex flex-col pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 lg:pl-4 space-y-6">
                            {/* Title */}
                            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-1 leading-tight font-playfair tracking-tight font-standard">
                                {product.name}
                            </h1>
                            <hr className="border-gray-100 mb-4" />

                            {/* Simplified Price Block */}
                            <div className="mb-2 pt-0">
                                <div className="flex items-baseline gap-2 font-standard">
                                    <span className="text-[13px] font-bold text-gray-500 tracking-tight uppercase">M.R.P.</span>
                                    <span className="text-xl font-bold text-green-700 tracking-tight">
                                        ₹{product.price?.toLocaleString("en-IN") || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Ratings & Social Proof */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-0.5 text-orange-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} strokeWidth={2} />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer hover:underline font-standard">
                                    {Math.floor(Math.random() * 200) + 50} ratings
                                </span>
                            </div>

                            {/* Action / Add to Cart proxy Box */}
                            <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50 mb-0 w-full max-w-sm shadow-sm flex-1 flex flex-col">
                                <div className="flex flex-col mb-3">
                                    <span className={`text-base font-semibold mb-0.5 ${((product.quantity || product.stock || 0) < 10) ? 'text-red-700' : 'text-green-700'}`}>
                                        {((product.quantity || product.stock || 0) < 10) ? (
                                            <span className="font-standard">Only {product.quantity || product.stock || 0} left in stock - order soon.</span>
                                        ) : 'In stock'}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Package size={14} /> Total Available Units: <span className="font-bold font-standard">{product.quantity || product.stock || 0}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-gray-200 text-[13px] flex-1">
                                    <div className="grid grid-cols-[110px_1fr] gap-2">
                                        <span className="text-gray-500">Category</span>
                                        <span className="font-semibold text-gray-900">{product.category || "N/A"}</span>
                                    </div>
                                    <div className="grid grid-cols-[110px_1fr] gap-2">
                                        <span className="text-gray-500">Plant Date</span>
                                        <span className="font-semibold text-gray-900 font-standard">{product.plantDate || "N/A"}</span>
                                    </div>
                                    <div className="grid grid-cols-[110px_1fr] gap-2">
                                        <span className="text-gray-500">Added Date</span>
                                        <span className="font-semibold text-gray-900 font-standard">
                                            {product.createdAt ? new Date(product.createdAt.toDate ? product.createdAt.toDate() : product.createdAt).toLocaleDateString('en-IN') : "N/A"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[110px_1fr] gap-2 pt-1">
                                        <span className="text-gray-500">Ships from</span>
                                        <span className="font-medium">{product.nurseryName || "ROPWALA"}</span>
                                    </div>

                                </div>
                            </div>



                        </div>
                    </div>

                    {/* Full Width Description Block */}
                    {product.description && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-tight">About product</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 marker:text-gray-400">
                                {/* Split description by sentences for bullet points if long enough, else just show as paragraph */}
                                {product.description.split('. ').map((sentence, index) => {
                                    if (sentence.trim().length > 0) {
                                        return <li key={index} className="leading-relaxed">{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</li>
                                    }
                                    return null;
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Customer Feedback Section */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Customer feedback</h4>

                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-orange-400"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
                                    <span className="text-xs font-bold text-gray-900">Verified Purchase</span>
                                </div>
                                <p className="text-sm text-gray-700 italic mb-2">"Great quality plants! Arrived in very good condition and much earlier than expected."</p>
                                <span className="text-xs text-gray-500">- jagdish jagdale</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex text-orange-400"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="none" /></div>
                                    <span className="text-xs font-bold text-gray-900">Verified Purchase</span>
                                </div>
                                <p className="text-sm text-gray-700 italic mb-2">"Healthy roots and nice packaging. Very satisfied with the seller's response."</p>
                                <span className="text-xs text-gray-500">- Pradip Babar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
