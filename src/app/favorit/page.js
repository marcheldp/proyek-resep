"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RecipeCard from '@/components/RecipeCard';
import { ArrowLeft, Bookmark, Loader2, ChefHat } from 'lucide-react';

export default function HalamanFavorit() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true; // 1. OPTIMASI: Penjaga Memory Leak

    // 2. OPTIMASI: Fungsi dimasukkan ke dalam useEffect
    async function fetchFavorites() {
      if (isMounted) setLoading(true);
      
      try {
        // Cek User Login
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        setUser(session.user);

        // 3. OPTIMASI: Tambahkan throwOnError() dan limit(50) untuk performa
        const { data } = await supabase
          .from('favorites')
          .select(`
            id,
            created_at,
            recipes (*)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(50) 
          .throwOnError();

        if (isMounted && data) {
          // Filter data jika ada resep yang terhapus tapi masih nyangkut di favorit
          const validFavorites = data.filter(item => item.recipes !== null);
          setFavorites(validFavorites);
        }

      } catch (error) {
        console.error("Gagal mengambil data favorit:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFavorites();

    return () => { isMounted = false; };
  }, []);

  // TAMPILAN LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Membuka Lemari Penyimpanan...</p>
      </div>
    );
  }

  // TAMPILAN JIKA BELUM LOGIN
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2EBE3] px-6 text-center">
        <div className="bg-white p-10 rounded-[40px] shadow-xl max-w-sm w-full border border-gray-100">
          <ChefHat size={50} className="text-orange-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">Akses Ditolak</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-8">Silakan masuk untuk melihat resep favorit Chef.</p>
          <Link href="/profil" className="bg-orange-500 text-white px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all block">
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 pt-8">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm text-gray-600 hover:text-orange-500 transition-all border border-gray-200 active:scale-90">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Koleksi <span className="text-yellow-600">Favorit</span></h1>
               <Bookmark className="text-yellow-500 fill-yellow-500 drop-shadow-sm" size={24} />
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
              {favorites.length} Resep Tersimpan
            </p>
          </div>
        </div>

        {/* GRID RESEP FAVORIT */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {favorites.map((fav) => {
              const r = fav.recipes;
              return (
                <div key={fav.id} className="w-full h-full animate-in fade-in zoom-in duration-500">
                  <RecipeCard 
                    id={r.id}
                    title={r.title}
                    image_url={r.image_url}
                    views={r.views}
                    likes={r.likes}
                    created_at={r.created_at} 
                    rating={r.rating_avg || 0}
                    favorites={r.favorites || 0}       
                    author={r.user_name || r.author}   
                    href={`/resep/${r.id}`} 
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/40 backdrop-blur-sm p-20 rounded-[40px] text-center border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
            <Bookmark size={40} className="text-gray-300 mb-4" />
            <p className="font-black text-gray-500 uppercase tracking-widest text-xs italic">Lemari resep masih kosong.</p>
            <Link href="/resep" className="mt-6 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] hover:text-orange-600 underline underline-offset-4">
              Jelajahi Resep
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
