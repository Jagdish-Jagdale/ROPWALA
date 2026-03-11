import { useState, useEffect } from "react";
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
    headerTitle: "हमीपत्र",
    headerSubtitle: "(नर्सरी फ्रँचायझी)",
    logoUrl: "/RopWala.png",
    introText: "मी / आम्ही ________ प्रतिज्ञापूर्वक म्हणतो / म्हणते की, मी / आम्ही ________ (फ्रँचायझी धारकाचे नाव) हा / ही ________ (पत्ता) येथे नर्सरी व्यवस्थापन व्यवसाय चालवत आहे / आहोत.",
    bulletins: [
        { text: "मी / आम्ही याप्रमाणे नमूद करतो की, नर्सरी व्यवस्थापन प्रणालीअंतर्गत फ्रँचायझी घेऊन व्यवसाय करत असताना सर्व नियम व अटींचे पालन करणे माझ्यावर / आमच्यावर बंधनकारक राईल.", icon: "Flower", color: "text-pink-500" },
        { text: "मी / आम्ही रोपवाला (नर्सरी व्यवस्थापन प्रणालीतून) दिलेल्या सर्व सूचना, मार्गदर्शक तत्त्वे व धोरणे यांचे पालन करीन / करू आणि संबंधित प्रशासनाने ठरविलेल्या अटी व शर्ती मान्य करतो / करते.", icon: "Flower2", color: "text-orange-500" },
        { text: "मी / आम्ही असेही नमूद करतो की, (रोपवाला) नर्सरी व्यवस्थापन प्रणालीचा वापर करून चालविल्या जाणाऱ्या व्यवसायातील सर्व व्यवहार, नोंदी व माहिती ही सत्य व अचूक राईल.", icon: "Sprout", color: "text-green-500" },
        { text: "मी / आम्ही खात्री देतो की, व्यवसायाशी संबंधित कोणतीही चुकीची माहिती देणार नाही तसेच कोणताही बेकायदेशीर व्यवहार करणार नाही.", icon: "Flower", color: "text-blue-500" },
        { text: "मी / आम्ही नर्सरी व्यवस्थापन प्रणालीद्वारे दिलेल्या डिजिटल नोंदी, दस्तऐवज व व्यवहार यांना वैध व अधिकृत मान्य करतो / करते.", icon: "Flower2", color: "text-purple-500" },
        { text: "मी / आम्ही याप्रमाणे खात्री देतो की, या फ्रँचायझी अंतर्गत चालणारा व्यवसाय संबंधित कायदे, नियम व शासनाच्या मार्गदर्शक सूचनांनुसारच चालविला जाईल.", icon: "Sprout", color: "text-yellow-500" },
        { text: "मी / आम्ही या हमीपत्राद्वारे असे नमूद करतो की, नर्सरी व्यवस्थापन प्रणाली अंतर्गत व्यवसाय करताना सर्व माहिती अचूक देणे व नियमांचे पालन करणे ही माझी / आमची जबाबदारी आहे.", icon: "Flower", color: "text-indigo-500" },
        { text: "जर या हमीपत्रातील माहिती खोटी आढळली किंवा नियमांचे उल्लंघन झाले तर संबंधित प्रशासनाला आवश्यक ती कारवाई करण्याचा पूर्ण अधिकार राईल.", icon: "Flower2", color: "text-rose-500" }
    ]
};

const ICON_MAP = {
    Flower: Flower,
    Flower2: Flower2,
    Sprout: Sprout
};

export default function AdminHamipatra() {
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
            const hamipatraDoc = await getDoc(doc(db, "settings", "hamipatra"));
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
            console.error("Error fetching hamipatra:", error);
            toast.error("Failed to load Hamipatra content");
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
            await setDoc(doc(db, "settings", "hamipatra"), {
                ...editedContent,
                updatedAt: new Date()
            });
            setContent(editedContent);
            setIsEditing(false);
            toast.success("Hamipatra updated successfully");
        } catch (error) {
            console.error("Error saving hamipatra:", error);
            toast.error("Failed to save changes");
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
                            Hamipatra
                        </h3>
                        <p className="text-base text-gray-600 font-normal mb-0">
                            Manage and view the official nursery franchise agreement template
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
                            >
                                <Edit2 size={18} />
                                Edit Page
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg font-bold transition-all"
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveLoading}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saveLoading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Save Changes
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
                    <p className="text-gray-500 font-medium">Loading agreement content...</p>
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
                                            placeholder="Logo path"
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
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">दिनांक</p>
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
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">फ्रँचायझी धारकाचे नाव</p>
                                <span className="inline-block border-b-2 border-dashed border-gray-300 w-full min-h-[40px]"></span>
                            </div>

                            <div className="col-span-1 text-center group">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 transition-colors group-hover:text-green-600">स्वाक्षरी (डिजिटल)</p>
                                <div className="inline-block border-2 border-dashed border-gray-100 bg-gray-50/50 rounded-2xl w-full max-w-[200px] h-24 flex flex-col items-center justify-center p-4 group-hover:bg-green-50 transition-colors mx-auto">
                                    <Pen className="text-gray-200 group-hover:text-green-200 transition-colors" size={32} />
                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter mt-2">Sign Here</span>
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
