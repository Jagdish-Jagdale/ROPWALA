import { useTranslation } from "react-i18next";

export default function AdminSettings() {
    const { t } = useTranslation(['settings']);
    
    return (
        <div className="font-sans min-h-screen p-0 pt-3">
            <div className="w-full px-4 py-2">
                <div className="mb-4">
                    <h3 className="text-xl mb-2 text-gray-900 font-extrabold">{t('settings:title')}</h3>
                    <p className="text-base text-gray-600 font-normal mb-0">{t('settings:subtitle')}</p>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />

                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-gray-500 text-lg text-center py-10">{t('settings:coming_soon')}</p>
                </div>
            </div>
        </div>
    )
}
