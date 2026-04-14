"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Sparkles, Clock, Eye, Loader2 } from 'lucide-react';

// --- KOMPONEN KARTU TIPS KHUSUS ---
const TipCard = ({ title, image_url, views, created_at, author, href }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Baru";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatNumber = (num) => {
    const parsedNum = parseInt(num, 10);
    if (isNaN(parsedNum) || parsedNum <= 0) return "0";
    if (parsedNum >= 1000000) return (parsedNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
    if (parsedNum >= 1000) return (parsedNum / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
    return parsedNum.toString();
  };

  const displayAuthor = author || "pakar_dapur";

  return (
    <Link href={href} className="group relative block w-full h-72 sm:h-64 rounded-3xl overflow-hidden shadow-lg border-2 border-white/20 active:scale-95 transition-all cursor-pointer">
      
      <Image 
        src={image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600'} 
        alt={title || 'Tips Memasak'} 
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover group-hover:scale-110 transition-transform duration-700" 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
      
      <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 flex flex-col justify-end z-20">
        <h3 className="text-white font-black text-lg md:text-xl leading-tight tracking-tighter mb-4 line-clamp-2 uppercase [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
          {title}
        </h3>

        <div className="flex items-center justify-between text-white/90 text-[9px] md:text-[10px] font-black uppercase tracking-widest drop-shadow-md w-full">
          
          <span className="flex items-center gap-1.5 shrink-0">
            <Clock size={12} className="text-green-400"/> {formatDate(created_at)}
          </span>

          <span className="text-blue-400 lowercase italic truncate flex-1 text-center px-2 max-w-[120px]">
            @{displayAuthor}
          </span>
          
          <span className="flex items-center gap-1.5 shrink-0">
            <Eye size={12} className="text-blue-400"/> {formatNumber(views)}
          </span>

        </div>
      </div>
    </Link>
  );
};

export default function SemuaTips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    let isMounted = true; // 1. OPTIMASI: Penjaga Memory Leak

    async function fetchTips() {
      if (isMounted) setLoading(true);
      try {
        const { data } = await supabase
          .from('tips')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100) // 2. OPTIMASI: Proteksi Memori & Database (Maksimal 13 Halaman)
          .throwOnError();

        if (isMounted && data) {
          setTips(data);
        }
      } catch (err) {
        console.error("Gagal mengambil tips:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchTips();

    // Cleanup function
    return () => { isMounted = false; };
  }, []);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(tips.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tips.slice(indexOfFirstItem, indexOfLastItem);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Membuka Gudang Ilmu...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header & Tombol Kembali */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm text-gray-500 hover:text-orange-500 transition-all border border-gray-200 active:scale-90">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Koleksi <span className="text-orange-500">Tips</span></h1>
               <Sparkles className="text-orange-400" size={24} />
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 italic">
              {tips.length} Artikel Rahasia Dapur Tersedia
            </p>
          </div>
        </div>

        {/* Grid Kartu Tips */}
        {tips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentItems.map((t) => (
              <TipCard 
                key={t.id} 
                title={t.title}
                image_url={t.image_url}
                views={t.views}
                created_at={t.created_at}
                author={t.user_name || t.author}
                href={`/tips/${t.id}`} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/40 backdrop-blur-sm p-20 rounded-[40px] text-center border-2 border-dashed border-gray-300">
            <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Belum ada tips yang tersedia.</p>
          </div>
        )}

        {/* --- KONTROL PAGINATION --- */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            <button 
              onClick={handlePrev} 
              disabled={currentPage === 1}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
                currentPage === 1 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-white text-gray-700 hover:bg-orange-500 hover:text-white border border-gray-200"
              }`}
            >
              Kembali
            </button>

            <div className="px-5 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm text-[10px] font-black text-gray-800">
              {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages}
            </div>

            <button 
              onClick={handleNext} 
              disabled={currentPage === totalPages}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
                currentPage === totalPages 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-white text-gray-700 hover:bg-orange-500 hover:text-white border border-gray-200"
              }`}
            >
              Lanjut
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
