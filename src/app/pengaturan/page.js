import Link from 'next/link';
import { Settings, ArrowLeft, Wrench } from 'lucide-react';

export default function Pengaturan() {
  return (
    <div className="bg-[#F2EBE3] min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Tombol Kembali */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <Link href="/" className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm text-gray-600 hover:text-orange-500 transition-all border border-[#D1C4B4] inline-block active:scale-90">
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Kartu Konten */}
      <div className="bg-[#E0D4C6] p-10 md:p-14 rounded-[40px] shadow-xl border border-[#D1C4B4] flex flex-col items-center text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-orange-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg rotate-3">
          <Settings size={40} className="animate-[spin_4s_linear_infinite]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter mb-3">Pengaturan</h1>
        <div className="h-1.5 w-12 bg-orange-500 rounded-full mb-6"></div>
        
        <div className="bg-white/40 px-6 py-3 rounded-2xl border border-white/60 flex items-center gap-3">
          <Wrench size={18} className="text-orange-500" />
          <p className="text-gray-700 font-bold text-sm">Halaman ini masih dalam tahap pengembangan</p>
        </div>
        
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-8 font-black italic">
          Harap maklum, masih dipikirkan...
        </p>
      </div>
    </div>
  );
}
