import React from 'react';

export default function Loader() {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-white/50 backdrop-blur-sm fixed inset-0 z-50">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-28 h-28 grid place-items-center">
          {/* Outer Ring - Spinning Clockwises */}
          <div className="absolute inset-0 border-[3px] border-transparent border-t-[#2d5a3d] rounded-full animate-[spin_3s_linear_infinite]" />

          {/* Middle Ring - Spinning Counter-Clockwise */}
          <div className="absolute inset-2 border-[3px] border-transparent border-t-[#2d5a3d]/40 border-b-[#2d5a3d]/40 rounded-full animate-[spin_3s_linear_infinite_reverse]" />

          {/* Inner Ring - Pulsing */}
          <div className="absolute inset-4 border-2 border-transparent border-l-[#2d5a3d]/20 rounded-full animate-pulse" />

          {/* Static Logo Center with Glow */}
          <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(45,90,61,0.15)] overflow-hidden p-3 animate-[pulse_3s_ease-in-out_infinite]">
            <img src="/RopWala.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
        </div>

        {/* App Name Text */}
        <div className="flex flex-col items-center animate-pulse">
          <h2 className="text-2xl font-serif font-bold text-[#2d5a3d] tracking-wide">ROPWALA</h2>
          <div className="h-1 w-12 bg-gradient-to-r from-transparent via-[#2d5a3d]/50 to-transparent mt-2 rounded-full" />
        </div>
      </div>
    </div>
  )
}
