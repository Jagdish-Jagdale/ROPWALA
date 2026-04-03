import { useEffect, useState } from "react";
import { Package, X, Star } from "lucide-react";

export default function OurProductViewModal({ isOpen, onClose, product }) {
    const [selectedImage, setSelectedImage] = useState("");

    useEffect(() => {
        if (product) {
            const images = product.imageUrls || (product.imageUrl ? [product.imageUrl] : []);
            setSelectedImage(images[0] || "");
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const imagesList = product.imageUrls?.length > 0
        ? product.imageUrls
        : (product.imageUrl ? [product.imageUrl] : []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 sticky top-0">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="text-green-600" size={24} />
                        Our Product Details
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
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

                        {/* LEFT SECTION: Images with Thumbnail Rail */}
                        <div className="w-full md:w-1/2 lg:w-[45%] flex gap-3">
                            {/* Vertical Thumbnail Rail */}
                            {imagesList.length > 1 && (
                                <div className="hidden sm:flex flex-col gap-2.5 min-w-[56px] max-h-[500px] overflow-y-auto custom-scrollbar pr-1 pb-4">
                                    {imagesList.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(url)}
                                            className={`w-[56px] h-[56px] rounded-xl object-cover border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${selectedImage === url ? 'border-green-600 shadow-md ring-1 ring-green-500 ring-offset-1' : 'border-gray-200 hover:border-green-400 opacity-60 hover:opacity-100'}`}
                                            onMouseEnter={() => setSelectedImage(url)}
                                        >
                                            <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Image Viewport */}
                            <div className="flex-1 flex flex-col">
                                <div className="w-full aspect-[4/5] rounded-2xl border border-gray-100 overflow-hidden relative bg-gray-50 flex items-center justify-center p-0 shadow-inner">
                                    {selectedImage ? (
                                        <img
                                            src={selectedImage}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x600?text=No+Image";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                            <Package size={64} className="opacity-50" />
                                            <span className="text-sm font-medium">No image available</span>
                                        </div>
                                    )}

                                    {/* Image counter badge */}
                                    {imagesList.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                                            {imagesList.indexOf(selectedImage) + 1} / {imagesList.length}
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Horizontal Thumbnails */}
                                {imagesList.length > 1 && (
                                    <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                                        {imagesList.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImage(url)}
                                                className={`w-14 h-14 rounded-xl object-cover border-2 overflow-hidden transition-all flex-shrink-0 bg-white ${selectedImage === url ? 'border-green-600 shadow-sm' : 'border-gray-200 opacity-60'}`}
                                            >
                                                <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Information Column */}
                        <div className="w-full md:w-1/2 lg:w-[55%] flex flex-col pt-2 md:pt-4 space-y-6">
                            
                            <div>
                                {/* Title */}
                                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-2 leading-tight tracking-tight">
                                    {product.name}
                                </h1>

                                {/* Ratings Preview */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} strokeWidth={i < 4 ? 0 : 2} className={i === 4 ? "text-gray-300" : ""} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">
                                        (Preview format)
                                    </span>
                                </div>
                            </div>

                            {/* Price Block */}
                            <div className="mb-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900 tracking-tight">
                                        ₹{product.price?.toLocaleString("en-IN") || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-gray-100" />

                            {/* Full Width Description Block */}
                            {product.description && (
                                <div className="pt-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">About this product</h4>
                                    <ul className="list-disc pl-5 space-y-2 text-base text-gray-700 marker:text-green-500">
                                        {product.description.split('. ').map((sentence, index) => {
                                            if (sentence.trim().length > 0) {
                                                return <li key={index} className="leading-relaxed pl-1">{sentence.trim()}{sentence.endsWith('.') ? '' : '.'}</li>
                                            }
                                            return null;
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="mt-auto pt-8">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2 text-sm text-gray-500">
                                    <div className="flex justify-between">
                                        <span>Total Images</span>
                                        <span className="font-semibold text-gray-900">{imagesList.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Added to Catalog</span>
                                        <span className="font-semibold text-gray-900">
                                            {product.createdAt ? new Date(product.createdAt.toDate ? product.createdAt.toDate() : product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently"}
                                        </span>
                                    </div>
                                    {product.updatedAt && (
                                        <div className="flex justify-between">
                                            <span>Last Updated</span>
                                            <span className="font-semibold text-gray-900">
                                                {new Date(product.updatedAt.toDate ? product.updatedAt.toDate() : product.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none transition-all shadow-sm"
                        style={{ borderRadius: "12px" }}
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
}
