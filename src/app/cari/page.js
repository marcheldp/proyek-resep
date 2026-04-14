"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image'; // <-- 1. IMPORT IMAGE NEXT.JS
import Link from 'next/link';
import { 
  Search, Loader2, ArrowLeft, UtensilsCrossed, BookOpen, 
  Eye, Heart, Star, Bookmark 
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [recipes, setRecipes] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false); // Default false agar tidak loading kosong di awal

  useEffect(() => {
    let isMounted = true; // <-- 2. PENJAGA MEMORY LEAK

    async function fetchResults() {
      if (!query.trim()) {
        if (isMounted) {
          setRecipes([]);
          setTips([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) setLoading(true);
      
      try {
        // 3. OPTIMASI: Tambahkan limit(20) dan throwOnError()
        const [recipesRes, tipsRes] = await Promise.all([
          supabase.from('recipes').select('*').ilike('title', `%${query}%`).order('created_at', { ascending: false }).limit(20).throwOnError(),
          supabase.from('tips').select('*').ilike('title', `%${query}%`).order('created_at', { ascending: false }).limit(20).throwOnError()
        ]);

        if (isMounted) {
          if (recipesRes.data) setRecipes(recipesRes.data);
          if (tipsRes.data) setTips(tipsRes.data);
        }
      } catch (error) {
        console.error("Gagal melakukan pencarian:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchResults();

    return () => { isMounted = false; };
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Mencari "{query}"...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 pt-8 px-4 md:px-10">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm text-gray-600 hover:text-orange-500 transition-all border border-gray-200 active:scale-90">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
              Hasil Pencarian: <span className="text-orange-500">"{query}"</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
              Ditemukan {recipes.length} Resep & {tips.length} Tips
            </p>
          </div>
        </div>

        {query && recipes.length === 0 && tips.length === 0 && (
          <div className="bg-white/40 backdrop-blur-sm p-20 rounded-[40px] text-center border-2 border-dashed border-[#D1C4B4]">
            <Search size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="font-black text-gray-500 uppercase tracking-widest text-xs italic">Waduh, tidak ada hasil yang cocok.</p>
          </div>
        )}

        <div className="space-y-12">
          {/* HASIL RESEP */}
          {recipes.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-[#D1C4B4] pb-4 mb-6">
                 <UtensilsCrossed size={18} className="text-orange-500"/> Kategori Resep
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recipes.map((item) => (
                  <Link key={item.id} href={`/resep/${item.id}`} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-orange-300 transition-all active:scale-[0.98] group">
                    
                    {/* 4. OPTIMASI GAMBAR NEXT.JS */}
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      <Image 
                        src={item.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=400'} 
                        alt={item.title} 
                        fill
                        sizes="96px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>

                    <div className="flex flex-col flex-grow overflow-hidden">
                      <p className="font-black text-sm text-gray-900 uppercase tracking-tighter group-hover:text-orange-500 transition-colors truncate">
                        {item.title}
                      </p>
                      
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest line-clamp-2 leading-relaxed">
                        {item.about || item.description || "Resep istimewa yang patut Anda coba sajikan..."}
                      </p>
                      
                      <div className="mt-3 flex items-center justify-between">
                         <p className="text-[9px] font-black text-orange-500 lowercase italic truncate pr-2">
                           @{item.author || item.user_name || 'koki_handal'}
                         </p>
                         <p className="text-[9px] font-bold text-gray-400 flex gap-2.5 shrink-0">
                           <span className="flex items-center gap-1 text-blue-500">
                             <Eye size={10}/> {item.views || 0}
                           </span>
                           <span className="flex items-center gap-1 text-pink-500">
                             <Heart size={10} fill={item.likes > 0 ? "currentColor" : "none"}/> {item.likes || 0}
                           </span>
                           <span className="flex items-center gap-1 text-orange-500">
                             <Star size={10} fill="currentColor"/> {item.rating_avg || 0}
                           </span>
                           <span className="flex items-center gap-1 text-yellow-600">
                             <Bookmark size={10}/> {item.favorites || 0}
                           </span>
                         </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* HASIL TIPS (Tetap sama, karena belum menggunakan gambar) */}
          {tips.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-[#D1C4B4] pb-4 mb-6">
                 <BookOpen size={18} className="text-blue-500"/> Kategori Info & Tips
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tips.map((item) => (
                  <Link key={item.id} href={`/tips/${item.id}`} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-blue-300 transition-all active:scale-[0.98] group">
                    <div>
                      <p className="font-black text-sm text-gray-900 uppercase tracking-tighter group-hover:text-blue-500 transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <p className="text-[9px] font-black text-blue-500 lowercase italic truncate">
                        @{item.author || item.user_name || 'pakar_dapur'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 shrink-0">
                        <Eye size={10} className="text-blue-500"/> {item.views || 0} <span className="font-light lowercase text-gray-300">pembaca</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper Suspense WAJIB untuk Next.js saat menggunakan useSearchParams
export default function HalamanPencarian() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2EBE3] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40}/></div>}>
      <SearchContent />
    </Suspense>
  );
}
