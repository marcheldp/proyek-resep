"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import RecipeCard from '../../components/RecipeCard'; 
import { 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  Clock, 
  Utensils, 
  Leaf, 
  Loader2 
} from 'lucide-react';

// Komponen inti yang membaca URL Parameter
function RecipeContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');     
  const category = searchParams.get('category'); 

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [titleInfo, setTitleInfo] = useState({ 
    text: "Semua Resep", 
    icon: Sparkles, 
    color: "text-orange-500" 
  });

  useEffect(() => {
    let isMounted = true; // 1. OPTIMASI: Penjaga Memory Leak

    // 2. OPTIMASI: Pindahkan fungsi ke dalam useEffect agar sesuai standar React
    async function fetchRecipes() {
      if (isMounted) setLoading(true);
      
      try {
        // 3. OPTIMASI: Tambahkan limit(50) agar tidak menarik ribuan data sekaligus yang bikin HP hang
        let query = supabase.from('recipes').select('*').limit(50);

        if (category === 'harian') {
          query = query.eq('category', 'harian').order('created_at', { ascending: false });
          if (isMounted) setTitleInfo({ text: "Resep Harian", icon: Utensils, color: "text-orange-500" });
        } 
        else if (category === 'sehat') {
          query = query.eq('category', 'sehat').order('created_at', { ascending: false });
          if (isMounted) setTitleInfo({ text: "Resep Sehat", icon: Leaf, color: "text-green-500" });
        } 
        else if (filter === 'populer') {
          query = query.gte('likes', 5).order('views', { ascending: false });
          if (isMounted) setTitleInfo({ text: "Resep Populer", icon: Flame, color: "text-red-500" });
        } 
        else {
          query = query.order('created_at', { ascending: false });
          if (isMounted) setTitleInfo({ text: "Resep Terbaru", icon: Clock, color: "text-blue-500" });
        }

        // Tambahkan throwOnError untuk keamanan jaringan
        const { data } = await query.throwOnError();
        
        if (isMounted && data) {
          setRecipes(data);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRecipes();

    // Fungsi cleanup saat user pindah halaman
    return () => { isMounted = false; };
  }, [filter, category]); // Effect akan dijalankan ulang jika filter/category di URL berubah

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center">
         <Loader2 className="animate-spin text-orange-500 mb-4 drop-shadow-md" size={40} />
         <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Menyiapkan Hidangan...</p>
      </div>
    );
  }

  const Icon = titleInfo.icon;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10">
      
      {/* Header & Tombol Kembali */}
      <div className="flex items-center gap-4 mb-10">
        <Link href="/" className="p-3 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm text-gray-600 hover:text-orange-500 transition-all border border-gray-200 active:scale-90">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{titleInfo.text}</h1>
             <Icon className={titleInfo.color} size={24} />
          </div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
            {recipes.length} Sajian Tersedia
          </p>
        </div>
      </div>

      {/* Grid Kartu Resep */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {recipes.map((r) => (
            <div key={r.id} className="w-full h-full">
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
          ))}
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur-sm p-20 rounded-[40px] text-center border-2 border-dashed border-gray-300">
          <p className="font-black text-gray-500 uppercase tracking-widest text-xs">Belum ada hidangan di kategori ini.</p>
        </div>
      )}
    </div>
  );
}

// Komponen Utama
export default function SemuaResep() {
  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 pt-8">
      <Suspense fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
           <Loader2 className="animate-spin text-orange-500 mb-4 drop-shadow-md" size={40} />
           <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse">Memuat Koleksi...</p>
        </div>
      }>
        <RecipeContent />
      </Suspense>
    </div>
  );
}
