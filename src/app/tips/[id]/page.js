"use client";

import Link from 'next/link';
import Image from 'next/image'; // 1. OPTIMASI: Import komponen Image Next.js
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, Eye, Loader2 } from 'lucide-react';

export default function DetailTips({ params }) {
  const resolvedParams = use(params);
  const tipId = resolvedParams.id;

  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // 2. OPTIMASI: Penjaga kebocoran memori (Memory Leak)

    async function initTipPage() {
      if (isMounted) setLoading(true);

      // Blok 1: Penambahan Views (Tidak memblokir jika gagal)
      try {
        await supabase.rpc('increment_tips_views', { row_id: tipId });
      } catch (err) {
        console.warn("Gagal menambah view:", err);
      }

      // Blok 2: Pengambilan Data Utama (Kritikal)
      try {
        const { data } = await supabase
          .from('tips')
          .select('*')
          .eq('id', tipId)
          .single()
          .throwOnError(); // 3. OPTIMASI: Lempar error langsung ke blok catch
        
        if (isMounted && data) {
          setTip(data);
        }
      } catch (error) {
        console.error("Gagal memuat artikel tips:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initTipPage();

    // Fungsi pembersihan saat user keluar dari halaman
    return () => { isMounted = false; };
  }, [tipId]);

  const getReadTime = (content) => {
    if (!content) return "1 Menit";
    const wordsPerMinute = 200; 
    const numberOfWords = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(numberOfWords / wordsPerMinute);
    return `${minutes} Menit Baca`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  const displayAuthor = tip?.user_name || tip?.author || 'pakar_dapur';

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-orange-500 mb-2" size={30} />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Menyusun Catatan...</p>
    </div>
  );

  if (!tip) return (
    <div className="p-20 text-center font-black uppercase italic min-h-screen bg-[#F2EBE3]">Catatan tidak ditemukan.</div>
  );

  return (
    <div className="bg-[#F2EBE3] min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
        <Link 
          href="/tips" 
          className="absolute top-6 left-6 z-30 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-black transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </Link>

        {/* 4. OPTIMASI: Ganti <img> dengan Next.js Image */}
        <Image 
          src={tip.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200'} 
          alt={tip.title}
          fill
          priority // Prioritaskan pemuatan agar hero tidak telat muncul
          sizes="100vw"
          className="object-cover" 
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end z-10">
          <div className="max-w-4xl mx-auto w-full px-6 pb-12">
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg">
              Knowledge
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter uppercase italic [text-shadow:2px_2px_10px_rgba(0,0,0,0.5)]">
              {tip.title}
            </h1>
          </div>
        </div>
      </div>

      {/* --- BODY SECTION --- */}
      <div className="max-w-3xl mx-auto px-6 py-12 relative z-20">
        
        {/* --- USERNAME TENGAH --- */}
        <div className="flex flex-col items-center mb-10">
           <div className="flex items-center gap-3 px-6 py-2.5 bg-[#E0D4C6] border border-[#D1C4B4] rounded-full shadow-sm animate-in fade-in zoom-in duration-700">
              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-black uppercase shadow-inner">
                {displayAuthor[0]}
              </div>
              <p className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em] italic">
                Ditulis Oleh @{displayAuthor}
              </p>
           </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between border-b border-[#D1C4B4]/50 pb-8 mb-12">
          <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-2"><Clock size={14} className="text-orange-500"/> {getReadTime(tip.content)}</span>
            <span className="flex items-center gap-2"><Eye size={14} className="text-blue-500"/> {tip.views || 0} View</span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {formatDate(tip.created_at)}
          </p>
        </div>

        {/* SEKSI ISI KONTEN TIPS */}
        <article className="prose prose-orange max-w-none">
          <div className="text-gray-800 leading-[2.1] text-lg md:text-xl font-light whitespace-pre-wrap text-left italic opacity-90 break-words">
            {tip.content}
          </div>
        </article>

        {/* Footer Signature */}
        <div className="mt-24 pt-10 border-t border-[#D1C4B4] text-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Terima Kasih Telah Membaca</p>
           <p className="text-sm font-black text-orange-500 uppercase tracking-tighter mt-2 italic">@{displayAuthor}</p>
        </div>
      </div>

    </div>
  );
}
