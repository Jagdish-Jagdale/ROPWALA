import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message,
    confirmText,
    itemName,
    isGlobalLoading = false,
}) {
    const [inputText, setInputText] = useState("");

    // Reset input when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setInputText("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn scale-100">
                <div className="p-6">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center gap-4">
                        {/* Warning Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={28} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                This action cannot be undone. This will permanently delete <span className="font-semibold text-gray-900">{itemName}</span> and remove all associated data.
                            </p>
                        </div>

                        {/* Input Confirmation */}
                        <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 text-left mt-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Type <span className="font-mono text-red-600 font-bold bg-white px-1 py-0.5 rounded border border-gray-200 select-all">{confirmText}</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-medium"
                                placeholder={`Type ${confirmText} here...`}
                                autoFocus
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full mt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
                                disabled={isGlobalLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={inputText !== confirmText || isGlobalLoading}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isGlobalLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Delete Permanently"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
