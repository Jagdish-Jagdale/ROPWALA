import React, { useRef } from "react";
import { Printer, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminHamipatra() {
    const componentRef = useRef();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const day = date.getDate();
        const months = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false });
    };

    const handlePrint = () => {
        window.print();
    };

    const declarations = [
        "मी स्वतः किंवा माझ्या कुटुंबातील सदस्य नियमित/कायम कर्मचारी म्हणून सरकारी विभाग/उपक्रम/मंडळ/भारत सरकार किंवा राज्य सरकारच्या स्थानिक संस्थेमध्ये कार्यरत नाही किंवा सेवानिवृत्तीनंतर निवृत्तीवेतन घेत नाही.",
        "माझ्या कुटुंबाचे एकत्रित वार्षिक उत्पन्न रु.२.५० लाख रुपयांपेक्षा अधिक नाही.",
        "माझ्याकडे उत्पन्न प्रमाणपत्र नसल्याने मला पिवळे किंवा केशरी रेशनकार्ड आधारे उत्पन्न प्रमाणपत्रातून सूट देण्यात यावी.",
        "माझ्या कुटुंबातील सदस्य आयकरदाता नाही.",
        "मी बाह्य यंत्रणेद्वारे कार्यरत असलेली कर्मचारी/स्वयंसेवी कामगार/कंत्राटी कर्मचारी असून माझे उत्पन्न रु.२.५० लाख पेक्षा कमी आहे.",
        "मी शासनाच्या इतर विभागामार्फत राबविण्यात येणाऱ्या दरमह्रा रु.१,५००/- किंवा त्यापेक्षा अधिक रकमेचा आर्थिक योजनेचा लाभ घेतलेला नाही.",
        "माझ्या कुटुंबातील सदस्य विद्यमान किंवा माजी खासदार/आमदार नाही.",
        "माझ्या कुटुंबातील सदस्य भारत सरकार किंवा राज्य सरकारच्या बोर्ड/कॉर्पोरेशन/बोर्ड/उपक्रमाचे अध्यक्ष/उपाध्यक्ष/संचालक/सदस्य नाहीत.",
        "माझ्याकडे किंवा माझ्या कुटुंबातील सदस्यांच्या नावावर चारचाकी वाहने (ट्रॅक्टर वगळून) नोंदणीकृत नाहीत.",
        "माझ्या कुटुंबात एकापेक्षा जास्त अविवाहित महिलेने या योजनेचा लाभ घेतलेला नाही."
    ];

    return (
        <div className="p-6 bg-gray-200 min-h-screen pb-20 overflow-y-auto">
            {/* Header Content (Hidden on Print) */}
            <div className="max-w-[1000px] mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">हमीपत्र (Invoice View)</h1>
                        <p className="text-sm text-gray-500">Professional quotation format</p>
                    </div>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg"
                >
                    <Printer size={20} />
                    <span>Print Document</span>
                </button>
            </div>

            {/* Document Sheet (Quotation Layout) */}
            <div
                ref={componentRef}
                className="mx-auto bg-white shadow-2xl p-[10mm] print:shadow-none print:border-none print:p-0 w-full max-w-[210mm] min-h-[297mm] relative transition-all"
                style={{
                    fontFamily: "'Noto Sans Devanagari', sans-serif"
                }}
            >
                {/* Header Branding Section */}
                <div className="flex justify-between items-start mb-4 px-6 pt-6">
                    {/* Left: Logo and Quote Title */}
                    <div className="flex flex-col items-center">
                        <img src="/RopeWala.png" alt="Logo" className="w-28 h-28 object-contain mb-4" />
                        <h2 className="text-2xl font-black text-blue-600 border-b-2 border-blue-600 px-4 pb-1 font-noto">
                            किंमत पत्र (हमीपत्र)
                        </h2>
                    </div>

                    {/* Right: Business Info */}
                    <div className="text-right">
                        <h1 className="text-4xl font-black text-red-600 mb-2 tracking-tighter uppercase italic font-noto">
                            रोपेवाला
                        </h1>
                        <div className="text-[14px] font-extrabold text-gray-700 leading-tight space-y-1 font-noto">
                            <p>बीड जिल्हा अधिकृत विक्रेता</p>
                            <p>नर्सरी व्यवस्थापन, रोप पुरवठा आणि सर्व्हिस</p>
                            <p>अंबाजोगाई रोड, जकात नाक्या जवळ, परळी वै.</p>
                            <p className="text-red-600">मो: 9975059508, 9834879997</p>
                        </div>
                    </div>
                </div>

                <div className="mx-6 h-[2px] bg-gray-900 mb-8 mt-4"></div>

                {/* Information Box (Gray) */}
                <div className="mx-6 mb-8 bg-gray-50 border border-gray-200 rounded-lg p-8 grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">श्री. रा. रा. : -</span>
                        <div className="flex-grow border-b-2 border-gray-300 border-dashed min-h-[24px]"></div>
                    </div>
                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">दिनांक: {formatDate(currentTime)}</span>
                    </div>

                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">शहर: -</span>
                        <div className="flex-grow border-b-2 border-gray-300 border-dashed min-h-[24px]"></div>
                    </div>
                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">पोस्ट: -</span>
                        <div className="flex-grow border-b-2 border-gray-300 border-dashed min-h-[24px]"></div>
                    </div>

                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">तालुका: -</span>
                        <div className="flex-grow border-b-2 border-gray-300 border-dashed min-h-[24px]"></div>
                    </div>
                    <div className="flex items-end gap-2 text-base font-noto">
                        <span className="font-extrabold text-gray-900 whitespace-nowrap">जिल्हा: -</span>
                        <div className="flex-grow border-b-2 border-gray-300 border-dashed min-h-[24px]"></div>
                    </div>
                </div>

                {/* Declarations Table Header (Red) */}
                <div className="mx-6 mb-8">
                    <div className="bg-red-600 text-white rounded-t-lg flex font-black text-sm uppercase tracking-wider font-noto">
                        <div className="w-20 py-4 px-4 border-r border-red-500 text-center">अनु.क्र.</div>
                        <div className="flex-grow py-4 px-4 text-center tracking-[0.2em]">तपशील</div>
                        <div className="w-40 py-4 px-4 border-l border-red-500 text-center">किंमत (₹)</div>
                    </div>
                    <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden bg-white">
                        {declarations.map((text, index) => (
                            <div key={index} className="flex border-b border-gray-100 last:border-b-0 text-[14px] font-bold text-gray-800 odd:bg-white even:bg-gray-50/50 font-noto">
                                <div className="w-20 py-4 px-4 bg-gray-50/80 border-r border-gray-100 text-center font-black">{index + 1}</div>
                                <div className="flex-grow py-4 px-8 text-justify leading-relaxed">{text}</div>
                                <div className="w-40 py-4 px-4 border-l border-gray-100 text-center"></div>
                            </div>
                        ))}
                        {/* Total Row */}
                        <div className="flex bg-gray-100 text-[14px] font-black font-noto text-gray-900">
                            <div className="w-20 py-4 px-4 bg-gray-100 border-r border-gray-200"></div>
                            <div className="flex-grow py-4 px-8 text-right pr-20 uppercase">अक्षरी रुपये: शून्य रुपये फक्त</div>
                            <div className="w-40 py-4 px-4 border-l border-gray-200 text-center tracking-tighter">एकूण : 0</div>
                        </div>
                    </div>
                </div>

                {/* Terms and Conditions Section */}
                <div className="mx-6 mb-12 px-6">
                    <h3 className="text-xl font-black text-gray-900 mb-4 border-b-4 border-red-600 inline-block pb-1 font-noto">
                        नियम आणि अटी :-
                    </h3>
                    <div className="space-y-4 text-[14px] font-extrabold text-gray-800 leading-relaxed text-justify font-noto">
                        <p>
                            मी वरीलप्रमाणे घोषित करतो की, "मुख्यमंत्री-माझी लाडकी बहीण" योजना संबंधित फ्रेंचायझी पोर्टलवर आधार क्रमांक आधारित प्रमाणीकरण प्रणाली सोबत स्वत:ला प्रमाणित करण्यास व आधार आधारित प्रमाणीकरणानंतर माझा आधार क्रमांक, बायोमेट्रिक किंवा वन टाइम पीन (OTP) माहिती प्रदान करण्याची सहमती देण्यात माझी हरकत नसेल. मी हे देखील सहमती देते की, "मुख्यमंत्री-माझी लाडकी बहीण" योजना माझी ओळख पटवण्यासाठी व प्रमाणित करण्यासाठी माझ्या आधार क्रमांकाचा वापर करू शकतात. मी केवळ शासकीय सेवा व योजनांचे लाभ प्राप्त करण्याच्या उद्देशाने अन्य राज्य किंवा केंद्र शासनाच्या विभागांशी माझे आधार ई-केवायसी (e-KYC) वर्णन पुरवण्यास सहमती देत आहे.
                        </p>
                    </div>
                </div>

                {/* Signatures Section */}
                <div className="mt-auto px-12 pb-16 flex justify-between items-end font-black text-base text-gray-900 font-noto">
                    <div className="flex flex-col items-center">
                        <div className="h-24 w-48 border-b-2 border-gray-400 mb-3 shadow-inner"></div>
                        <p>खरेदीदाराची सही</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="h-24 w-48 mb-3 flex flex-col items-center justify-center relative">
                            <img src="/RopeWala.png" alt="Seal" className="w-16 h-16 grayscale opacity-10 absolute pointer-events-none" />
                            <div className="italic text-xs font-bold text-gray-300">(शिक्का)</div>
                        </div>
                        <p className="text-red-600">तर्फे : रोपेवाला</p>
                    </div>
                </div>

                {/* Print Info */}
                <div className="mx-6 pt-6 border-t border-gray-200 text-[11px] font-bold text-gray-400 flex justify-between tracking-widest font-noto">
                    <p>PRINTED ON: {formatDate(currentTime)} {formatTime(currentTime)}</p>
                    <p>ROPEWALA MANAGEMENT SYSTEM</p>
                </div>
            </div>

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                    .h-screen { height: auto !important; overflow: visible !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .bg-gray-200 { background: white !important; }
                    .max-w-[210mm] { max-width: none !important; width: 210mm !important; height: 297mm !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    .print-hide { display: none !important; }
                }
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;700;800;900&display=swap');
                
                .font-noto { font-family: 'Noto Sans Devanagari', sans-serif; }
            `}} />
        </div>
    );
}
