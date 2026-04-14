import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Heart, Star, Bookmark } from 'lucide-react';

export default function RecipeCard({ id, title, image_url, views, likes, created_at, rating, favorites, author, href }) {
  
  // PERBAIKAN 1: Memaksa nilai menjadi angka (Integer) untuk mencegah error null/string
  const formatNumber = (num) => {
    const parsedNum = parseInt(num, 10);
    
    // Jika data null, undefined, atau bukan angka, kembalikan "0"
    if (isNaN(parsedNum) || parsedNum <= 0) return "0";
    
    if (parsedNum >= 1000000) return (parsedNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
    if (parsedNum >= 1000) return (parsedNum / 1000).toFixed(1).replace(/\.0$/, '') + 'rb';
    return parsedNum.toString();
  };

  // PERBAIKAN 2: Memaksa rating menjadi Float (Desimal) dan memberi fallback "0.0"
  const parsedRating = parseFloat(rating);
  const displayRating = (!isNaN(parsedRating) && parsedRating > 0) 
    ? parsedRating.toFixed(1) 
    : "0.0";

  const formatCompactDate = (dateString) => {
    if (!dateString) return "Baru";
    const date = new Date(dateString);
    // Tahun dihapus agar teks tidak terlalu sesak di card kecil
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const displayAuthor = author || "koki_handal";

  return (
    <Link href={href || `/resep/${id}`} className="block group w-full h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm group-hover:shadow-md transition-all duration-500">
        
        {/* OPTIMASI GAMBAR */}
        <Image 
          src={image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800'} 
          alt={title || 'Resep'} 
          fill
          sizes="(max-width: 768px) 40vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        
        {/* GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10"></div>

        {/* --- FLOATING BADGE: FAVORIT --- */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-20">
          <Bookmark size={8} className="text-yellow-500 fill-yellow-500" />
          <span className="text-[7px] sm:text-[9px] font-black text-yellow-600 uppercase tracking-tighter">
            {formatNumber(favorites)}
          </span>
        </div>

        {/* --- FLOATING BADGE: RATING --- */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-1 rounded-lg flex items-center gap-1 shadow-sm z-20">
          <Star size={8} className="text-orange-500 fill-orange-500" />
          <span className="text-[7px] sm:text-[9px] font-black text-orange-600 uppercase tracking-tighter">
            {displayRating}
          </span>
        </div>

        {/* --- KONTEN BAWAH (Gunakan z-20 agar di atas gradient) --- */}
        <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-4 z-20">
          <h3 className="text-white text-[10px] sm:text-sm font-black uppercase tracking-tighter leading-tight line-clamp-2 mb-1.5">
            {title}
          </h3>

          <div className="flex items-center justify-between text-white/90">
            <div className="flex items-center gap-0.5 shrink-0">
              <Clock size={8} className="text-green-400" />
              <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tighter">
                {formatCompactDate(created_at)}
              </span>
            </div>
            
            <p className="text-[7px] sm:text-[9px] font-black text-orange-400 lowercase italic tracking-tighter truncate flex-1 text-center px-1">
              @{displayAuthor}
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-0.5 shrink-0">
                <Eye size={8} className="text-blue-400" />
                <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tighter">
                  {formatNumber(views)}
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <Heart size={8} className="text-pink-500 fill-pink-500" />
                <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tighter">
                  {formatNumber(likes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
