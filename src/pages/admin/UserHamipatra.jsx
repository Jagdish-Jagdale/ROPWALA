import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    FileText,
    Pen,
    Stamp,
    Flower,
    Flower2,
    Sprout,
    Edit2,
    Save,
    X,
    Loader2
} from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const DEFAULT_CONTENT = {
    headerTitle: "नियम व अटी",
    headerSubtitle: "(वापरकर्ता हमीपत्र)",
    logoUrl: "/RopWala.png",
    introText: "मी / आम्ही ________ प्रतिज्ञापूर्वक म्हणतो / म्हणते की, मी / आम्ही ________ (वापरकर्त्याचे नाव) हा / ही ________ (पत्ता) येथे अधिकृत वापरकर्ता म्हणून खालील नियम व अटींच्या अधीन राहून सेवा घेत आहे / आहोत.",
    bulletins: [
        { text: "रोप खरेदी करण्यापूर्वी रोप निरोगी, दर्जेदार, जातीवंत तसेच सदर जातीच्या रोपांची रोपवाटिका धारकाची बियाणे खरेदी पावती, लॉट नंबर, बॅच नंबर, इत्यादी गोष्टीची खात्री करुनच रोप खरेदी केले.", icon: "Flower", color: "text-pink-500" },
        { text: "रोप खरेदी करण्यापूर्वी ज्या हंगामात त्याची लागवड करायची आहे तो हंगाम त्या बियाण्यांच्या / रोपांच्या जातीसाठी योग्य आहे किंवा नाही याची खात्री सदरहून कंपनी प्रतिनिधी किंवा कंपनीच्या कस्टमर केअर नंबर वरती चौकशी करुनच या रोपांची खरेदी करीत आहोत.", icon: "Flower2", color: "text-orange-500" },
        { text: "रोप लागवडीनंतर उत्पादन हे हवामान, हंगाम, जमिनीचा प्रकार, खत, औषधे, पाणी, मशागत, इत्यादी गोष्टीवर अवलंबून असते. त्यामुळे उत्पादनात फरक येऊ शकतो. तसेच रोप विक्रेत्याकडून अथवा नर्सरी कडून या घटकांमुळे आलेल्या नुकसानीसाठी कोणतीही भरपाई किंवा जबाबदारी स्विकारली जाणार नाही.", icon: "Sprout", color: "text-green-500" },
        { text: "रोपांचे वय जास्त किंवा कमी असू शकते. या बाबत नर्सरी कडून मला योग्य माहीती देण्यात आली आहे. ती माहीती मला मान्य असून, मी ती रोपे माझ्या स्वतःच्या जबाबदारीवर रोपे खरेदी करीत आहोत.", icon: "Flower", color: "text-blue-500" },
        { text: "ओपन पॉलिनेटेड (OP) प्रकारच्या वाणांमध्ये नैसर्गिकरित्या अनियमितता येऊ शकते. या बाबत नर्सरी धारकाने मला पुर्व कल्पना दिली आहे. आणि त्या अनियमिततेसाठी नर्सरी कोणत्याही प्रकारे जबाबदार राहणार नाही.", icon: "Flower2", color: "text-purple-500" },
        { text: "रोपे खरेदी करतांना ती पुर्णपणे किड / रोग मुक्त असल्याची मी खात्री केली आहे. मी खात्री केलेली रोपे टजेलदार उत्तम वाढ झालेली आहेत.", icon: "Sprout", color: "text-yellow-500" },
        { text: "वरील सर्व अटी व नियम मला मान्य असून मी रोपे स्वतःच्या जबाबदारीवर खरेदी करत आहे.", icon: "Flower", color: "text-indigo-500" }
    ]
};

const ICON_MAP = {
    Flower: Flower,
    Flower2: Flower2,
    Sprout: Sprout
};

export default function AdminUserHamipatra() {
    const { t } = useTranslation(['hamipatra', 'common']);
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [editedContent, setEditedContent] = useState(DEFAULT_CONTENT);

    useEffect(() => {
        fetchHamipatra();
    }, []);

    const fetchHamipatra = async () => {
        try {
            setLoading(true);
            const hamipatraDoc = await getDoc(doc(db, "settings", "userhamipatra"));
            if (hamipatraDoc.exists()) {
                const data = hamipatraDoc.data();
                setContent({
                    ...DEFAULT_CONTENT,
                    ...data
                });
            } else {
                setContent(DEFAULT_CONTENT);
            }
        } catch (error) {
            console.error("Error fetching user hamipatra:", error);
            toast.error(t('hamipatra:user.toast.load_error'));
            setContent(DEFAULT_CONTENT);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditedContent({ ...content });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setSaveLoading(true);
            await setDoc(doc(db, "settings", "userhamipatra"), {
                ...editedContent,
                updatedAt: new Date()
            });
            setContent(editedContent);
            setIsEditing(false);
            toast.success(t('hamipatra:user.toast.update_success'));
        } catch (error) {
            console.error("Error saving user hamipatra:", error);
            toast.error(t('hamipatra:user.toast.save_error'));
        } finally {
            setSaveLoading(false);
        }
    };

    const updateBulletinText = (index, newText) => {
        const updatedBulletins = [...editedContent.bulletins];
        updatedBulletins[index].text = newText;
        setEditedContent({ ...editedContent, bulletins: updatedBulletins });
    };

    return (
        <div className="min-h-screen bg-transparent p-0 pt-3 font-sans">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
                
                .hamipatra-document {
                    font-family: 'Poppins', 'Noto Sans Devanagari', sans-serif;
                }
                
                .hamipatra-marathi {
                    font-family: 'Noto Sans Devanagari', sans-serif;
                }

                textarea.seamless-editor {
                    resize: none;
                    overflow: hidden;
                    background: transparent;
                    border: none;
                    outline: none;
                    box-shadow: none;
                    width: 100%;
                }

                textarea.seamless-editor:focus {
                    outline: none;
                    box-shadow: none;
                    background: rgba(34, 197, 94, 0.03);
                }
            `}} />

            {/* Header / Actions */}
            <div className="w-full px-4 py-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-xl mb-2 text-gray-900 font-extrabold">
                            {t('hamipatra:user.title')}
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            {t('hamipatra:user.subtitle')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-bold transition-all shadow-sm font-sans"
                                style={{ borderRadius: "12px" }}
                            >
                                <Edit2 size={18} />
                                {t('hamipatra:user.edit_page')}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 font-bold transition-all font-sans"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <X size={18} />
                                    {t('common:cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveLoading}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                                    style={{ borderRadius: "12px" }}
                                >
                                    {saveLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {t('common:save_changes')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <hr className="mt-4 mb-5 border-gray-100" />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={48} className="text-green-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">{t('hamipatra:user.loading')}</p>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto bg-white shadow-2xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden relative overflow-x-auto hamipatra-document">
                    <div className="p-8 md:p-16 text-gray-800 leading-relaxed min-w-[700px]">
                        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
                            <Stamp size={200} />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-6">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2">
                                        <img
                                            src={editedContent.logoUrl || "/RopWala.png"}
                                            className="w-24 h-24 object-contain"
                                            alt="Logo"
                                        />
                                        <input
                                            type="text"
                                            value={editedContent.logoUrl}
                                            onChange={(e) => setEditedContent({ ...editedContent, logoUrl: e.target.value })}
                                            placeholder={t('hamipatra:user.placeholders.logo')}
                                            className="text-[10px] w-24 p-1 border border-gray-100 rounded bg-gray-50 focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={content.logoUrl || "/RopWala.png"}
                                        className="w-24 h-24 object-contain"
                                        alt="Logo"
                                    />
                                )}
                                <div className="flex-1">
                                    {isEditing ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editedContent.headerTitle}
                                                onChange={(e) => setEditedContent({ ...editedContent, headerTitle: e.target.value })}
                                                className="text-4xl font-black text-gray-900 tracking-tight hamipatra-marathi w-full bg-transparent border-none focus:outline-none focus:ring-0 mb-1"
                                            />
                                            <input
                                                type="text"
                                                value={editedContent.headerSubtitle}
                                                onChange={(e) => setEditedContent({ ...editedContent, headerSubtitle: e.target.value })}
                                                className="text-xl font-bold text-gray-500 hamipatra-marathi w-full bg-transparent border-none focus:outline-none focus:ring-0"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-4xl font-black text-gray-900 tracking-tight hamipatra-marathi">
                                                {content.headerTitle}
                                            </h2>
                                            <p className="text-xl font-bold text-gray-500 mt-1 hamipatra-marathi">
                                                {content.headerSubtitle}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t('hamipatra:user.labels.date')}</p>
                                <span className="inline-block border-b-2 border-dashed border-gray-300 w-32 min-h-[30px]"></span>
                            </div>
                        </div>
                        <hr className="border-t-2 border-gray-100 mb-10" />

                        <div className="space-y-8 text-lg font-medium hamipatra-marathi">
                            {isEditing ? (
                                <textarea
                                    value={editedContent.introText}
                                    onChange={(e) => setEditedContent({ ...editedContent, introText: e.target.value })}
                                    className="seamless-editor text-justify mt-5 leading-relaxed overflow-hidden h-auto"
                                    rows={3}
                                />
                            ) : (
                                <p className="text-justify mt-5 leading-relaxed whitespace-pre-wrap">
                                    {content.introText.split('________').map((part, i, arr) => (
                                        <span key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                <span className="inline-block border-b-2 border-dashed border-gray-300 min-w-[150px] mx-1"></span>
                                            )}
                                        </span>
                                    ))}
                                </p>
                            )}

                            <div className="space-y-6">
                                {(isEditing ? editedContent.bulletins : content.bulletins).map((item, idx) => {
                                    const IconComponent = ICON_MAP[item.icon] || Flower;
                                    return (
                                        <div key={idx} className="flex gap-4 group/bullet">
                                            <div className="mt-1.5 min-w-[24px]">
                                                <IconComponent size={20} className={`${item.color} opacity-100`} />
                                            </div>
                                            {isEditing ? (
                                                <textarea
                                                    value={item.text}
                                                    onChange={(e) => updateBulletinText(idx, e.target.value)}
                                                    className="seamless-editor text-[18px] leading-relaxed text-gray-700 hamipatra-marathi h-auto"
                                                    rows={Math.ceil(item.text.length / 45) || 1}
                                                />
                                            ) : (
                                                <p className="text-justify text-gray-700 leading-snug">{item.text}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-20 grid grid-cols-2 gap-x-8 items-end hamipatra-marathi">
                            <div className="col-span-1">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t('hamipatra:user.labels.farmer_name')}</p>
                                <span className="inline-block border-b-2 border-dashed border-gray-300 w-full min-h-[40px]"></span>
                            </div>

                            <div className="col-span-1 text-center group">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 transition-colors group-hover:text-green-600">{t('hamipatra:user.labels.nursery_signature')}</p>
                                <div className="inline-block border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-2xl w-full max-w-[200px] h-24 flex flex-col items-center justify-center p-4 group-hover:bg-green-50 transition-colors mx-auto">
                                    <Pen className="text-gray-200 group-hover:text-green-200 transition-colors" size={32} />
                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter mt-2">{t('hamipatra:user.labels.sign_here')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-4xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
                    .shadow-2xl, .border, .rounded-2xl { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
                    .bg-gray-50\\/50 { background: white !important; }
                    .p-16 { padding: 0 !important; }
                    .mt-20 { margin-top: 100px !important; }
                    @page { margin: 2cm; }
                    .hamipatra-document { font-family: 'Poppins', 'Noto Sans Devanagari', sans-serif !important; }
                    .hamipatra-marathi { font-family: 'Noto Sans Devanagari', sans-serif !important; }
                }
            ` }} />
        </div>
    );
}
