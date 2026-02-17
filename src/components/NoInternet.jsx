import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

const NoInternet = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cube-coat.png')]"></div>
            </div>

            <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 max-w-lg w-full relative z-10">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-soft-pulse ring-8 ring-red-50/50">
                    <WifiOff size={40} className="text-red-500" strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-serif">
                    Connection Lost
                </h1>

                <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                    It looks like you're offline. Check your internet connection and give it another try.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="mx-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-[#2d5a3d] text-white text-sm font-bold !rounded-full overflow-hidden shadow-lg shadow-[#2d5a3d]/20 hover:bg-[#1e3d29] hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span>Try Again</span>
                </button>

                <p className="border-t border-gray-100 mt-8 pt-6 text-xs text-gray-400 font-medium uppercase tracking-widest">
                    Check your Wi-Fi or Mobile Data
                </p>
            </div>
        </div>
    );
};

export default NoInternet;
