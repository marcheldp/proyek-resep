"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RecipeCard from '../components/RecipeCard'; // Ganti path sesuai lokasi Anda
import Hero from '../components/Hero'; 
import { 
  Flame, Lightbulb, ArrowRight, Loader2, 
  Clock, Utensils, Leaf, Eye 
} from 'lucide-react';

// --- KOMPONEN INTERNAL: PANAH KHUSUS ---
const SupabaseArrow = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 21.0001L14.07 18.9301L10.07 14.9301L18.9301 14.9301L18.9301 10.9301L10.07 10.9301L14.07 6.93013L12 4.86011L3.00003 12L12 21.0001Z" fill="currentColor" />
  </svg>
);

// --- KOMPONEN INTERNAL: KARTU TIPS (Tanggal, Username, View) ---
const TipCard = ({ title, image_url, views, created_at, author, href }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Baru saja";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000) return (num / 1000).toFixed(1) + 'rb';
    return num.toString();
  };

  const displayAuthor = author || "pakar_dapur";

  return (
    <Link href={href} className="group relative block w-full h-72 sm:h-64 rounded-3xl overflow-hidden shadow-lg border-2 border-white/20 active:scale-95 transition-all cursor-pointer">
      <Image 
        src={image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600'} 
        alt={title || 'Gambar Tips'} 
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover group-hover:scale-110 transition-transform duration-700" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
        <h3 className="text-white font-black text-xl md:text-2xl leading-tight tracking-tighter mb-4 line-clamp-2 uppercase [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
          {title}
        </h3>
        
        {/* Baris Statistik Tips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-[10px] md:text-xs font-black uppercase tracking-widest drop-shadow-md">
          {/* 1. Jam Dibuat */}
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-green-400"/> {formatDate(created_at)}</span>
          
          {/* 2. Username */}
          <span className="text-blue-400 lowercase italic truncate max-w-[100px] md:max-w-[150px]">@{displayAuthor}</span>

          {/* 3. Views */}
          <span className="flex items-center gap-1.5"><Eye size={14} className="text-blue-400"/> {formatNumber(views)}</span>
        </div>
      </div>
    </Link>
  );
};

// --- KOMPONEN INTERNAL: SEKSI RESEP REUSABLE ---
const RecipeSection = ({ title, subtitle, icon, data, href, isFirst = false }) => {
  const displayData = data.slice(0, 6);
  const hasMore = data.length > 6;

  return (
    <section className={`max-w-[1440px] mx-auto ${isFirst ? 'pt-8' : 'pt-1'} pb-0 relative z-10`}>
      <div className="flex items-center justify-between mb-3 px-4 md:px-10">
        <div className="flex items-center gap-2">
           <h2 className="text-lg tracking-[0.2em] leading-none [text-shadow:1px_1px_4px_rgba(0,0,0,0.8)]">
              <span className="font-black uppercase text-white">{title}</span> <span className="text-orange-500 font-normal lowercase">{subtitle}</span>
           </h2>
           <span className="text-orange-500 flex items-center drop-shadow-md">{icon}</span>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-3 px-4 md:px-10 pb-4 snap-x snap-mandatory scroll-smooth items-stretch [&::-webkit-scrollbar]:hidden">
        {displayData.length > 0 ? (
          <>
            {displayData.map((r) => (
              // DI SINI PERUBAHANNYA: 
              // w-[40%] di mobile (agar muat 2.5 kartu), sm:w-[30%], md:w-[22%]
              <div key={r.id} className="w-[40%] sm:w-[30%] md:w-[22%] lg:w-[calc(20%-12px)] flex-shrink-0 snap-center sm:snap-start">
                <RecipeCard 
                  id={r.id}
                  title={r.title}
                  image_url={r.image_url}
                  views={r.views}
                  likes={r.likes}
                  created_at={r.created_at} 
                  rating={r.rating_avg || 0} 
                  favorites={r.favorites || 0}
                  author={r.author || r.user_name}
                  href={`/resep/${r.id}`} 
                />
              </div>
            ))}
            
            {hasMore && (
              <Link href={href} className="w-[100px] flex-shrink-0 snap-center bg-white/80 backdrop-blur-sm rounded-2xl border-[3px] border-dashed border-orange-200 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition-all cursor-pointer group shadow-sm p-2">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <SupabaseArrow size={14} className="text-orange-500 drop-shadow-sm" />
                  </div>
                  <span className="font-black text-orange-500 text-[8px] uppercase tracking-[0.2em] text-center leading-tight [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]">
                    LIHAT<br/>SEMUA
                  </span>
              </Link>
            )}
          </>
        ) : (
          <div className="w-full text-center py-10 border-2 border-dashed border-gray-300 rounded-2xl bg-white/30 backdrop-blur-sm mt-2">
             <p className="text-white font-black text-[10px] uppercase tracking-[0.3em] italic [text-shadow:1px_1px_4px_rgba(0,0,0,0.8)]">
               Belum ada resep di kategori ini...
             </p>
          </div>
        )}
      </div>
    </section>
  );
};

// --- KOMPONEN UTAMA BERANDA ---
export default function Home() {
  const [data, setData] = useState({ popular: [], terbaru: [], harian: [], sehat: [], tips: [] });
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUserStatus();
    fetchHomeData();
  }, []);

  async function checkUserStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  }

  async function fetchHomeData() {
    setLoading(true);
    try {
      // UBAH BAGIAN INI:
      const fetchByCat = (cat) => 
        supabase.from('recipes')
          .select('*')
          .eq('category', cat)
          .order('created_at', { ascending: false })
          .limit(7)
          .throwOnError(); // <--- Tambahkan ini
      
      const [pop, ter, har, seh, tip] = await Promise.all([
        supabase.from('recipes').select('*').gte('likes', 5).order('views', { ascending: false }).limit(7).throwOnError(), // <--- Tambahkan ini
        supabase.from('recipes').select('*').order('created_at', { ascending: false }).limit(7).throwOnError(), // <--- Tambahkan ini
        fetchByCat('harian'),
        fetchByCat('sehat'),
        supabase.from('tips').select('*').order('created_at', { ascending: false }).limit(5).throwOnError() // <--- Tambahkan ini
      ]);

      setData({
        popular: pop.data || [],
        terbaru: ter.data || [],
        harian: har.data || [],
        sehat: seh.data || [],
        tips: tip.data || []
      });
    } catch (err) {
      console.error("Gagal mengambil data beranda:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Menyiapkan Dapur...</p>
    </div>
  );

  return (
    <div 
      className="relative pb-20 overflow-hidden min-h-screen bg-[#F2EBE3]"
      style={{ 
        backgroundImage: "url('/img/doodle.png')", 
        backgroundRepeat: "repeat-y", 
        backgroundSize: "100% auto"   
      }}
    >
      <Hero />

      <div className="relative z-10">
        {/* SEKSI RESEP */}
        <RecipeSection title="RESEP" subtitle="populer" icon={<Flame size={16} fill="currentColor" />} data={data.popular} href="/resep?filter=populer" isFirst={true} />
        <RecipeSection title="RESEP" subtitle="terbaru" icon={<Clock size={16} />} data={data.terbaru} href="/resep?filter=terbaru" />
        <RecipeSection title="RESEP" subtitle="harian" icon={<Utensils size={16} />} data={data.harian} href="/resep?category=harian" />
        <RecipeSection title="RESEP" subtitle="sehat" icon={<Leaf size={16} />} data={data.sehat} href="/resep?category=sehat" />

        {/* SEKSI TIPS */}
        <section className="max-w-[1440px] mx-auto pt-2 pb-10">
          <div className="flex items-center justify-between mb-3 px-4 md:px-10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg tracking-widest leading-none [text-shadow:1px_1px_4px_rgba(0,0,0,0.8)]">
                 <span className="text-white font-black uppercase">RESEP</span> <span className="text-orange-500 font-normal lowercase">tips</span>
              </h2>
              <Lightbulb className="text-orange-400 drop-shadow-md" size={16} />
            </div>
            {data.tips.length > 4 && (
              <Link href="/tips" className="group flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:text-red-600 transition-colors">
                Lihat Semua <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-10 pb-8 mt-2">
            {data.tips.slice(0, 4).map((t) => (
              <TipCard 
                key={t.id} 
                title={t.title} 
                image_url={t.image_url} 
                views={t.views} 
                created_at={t.created_at}
                author={t.author || t.user_name}             // <-- Mengirim Props Username
                href={`/tips/${t.id}`} 
              />
            ))}
          </div>
        </section>
        
        {/* LOGIKA CTA: HANYA MUNCUL JIKA BELUM LOGIN */}
        {!isLoggedIn && (
          <section className="max-w-7xl mx-auto py-24 px-6 text-center animate-in fade-in zoom-in duration-700">
            <div className="space-y-4">
              <h2 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-tight inline-block [text-shadow:2px_2px_6px_rgba(0,0,0,0.8)]">
                Punya rahasia dapur yang ingin dunia tahu? <br className="hidden md:block"/>
                Atau ingin mulai mengukir cerita rasamu sendiri?
              </h2>
              <p className="text-xs md:text-base text-white font-medium lowercase tracking-tight [text-shadow:1px_1px_4px_rgba(0,0,0,0.8)]">
                jadilah bagian dari komunitas pencipta rasa kami.
              </p>
              <div className="pt-6">
                <Link href="/profil" className="text-orange-500 font-black text-sm md:text-xl uppercase tracking-[0.4em] underline decoration-2 underline-offset-8 hover:text-orange-600 transition-all active:scale-95 inline-block">
                  Gabung Sekarang!
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
