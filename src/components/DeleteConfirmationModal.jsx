import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Resource",
    message,
    itemName,
    isGlobalLoading = false,
}) {
    const { t } = useTranslation(['common']);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[510px] overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-4">
                    <div className="flex items-start gap-3">
                        {/* Warning Icon (Left Side) */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-red-100/80 flex items-center justify-center shadow-inner">
                                <AlertTriangle className="text-[#ff0000]" size={22} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-grow pt-0.5">
                            <h3 className="text-[20px] font-bold text-[#1a202c]  mb-3">
                                {title}
                            </h3>
                            <div className="text-[14px] text-[#4a5568] leading-relaxed mb-0.5">
                                {message || (
                                    <>
                                        {t('common:delete_confirm_msg', { defaultValue: 'Are you sure you want to delete' })} <span className="font-semibold text-gray-900">{itemName || t('common:this_resource', 'this resource')}</span>?
                                    </>
                                )}
                            </div>
                            <p className="text-[12px] text-gray-400 font-medium tracking-wide">
                                {t('common:delete_undone')}
                            </p>
                        </div>
                    </div>

                    {/* Actions (Bottom Right) */}
                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-[#2d3748] bg-[#f1f5f9] hover:bg-[#e2e8f0] !rounded-sm transition-all active:scale-[0.98] min-w-[100px]"
                            disabled={isGlobalLoading}
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isGlobalLoading}
                            className="px-6 py-2 text-sm font-bold text-white bg-[#ff0000] hover:bg-[#e60000] !rounded-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/10 active:scale-[0.98] flex items-center justify-center gap-2 min-w-[100px]"
                        >
                            {isGlobalLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white !rounded-sm animate-spin" />
                            ) : (
                                t('common:delete')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
