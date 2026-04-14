"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  // ID Video dari: https://youtu.be/q-BscsUflrw?si=5CBgzJ42uxEN-RZS 
  // (4K Food Footage | Saucy vegetables stirred in pot)
  const videoId = "q-BscsUflrw"; 

  return (
    <section className="w-full relative aspect-[4/3] overflow-hidden bg-black border-b border-gray-100">
      
      {/* --- LAYER 1: GAMBAR PLACEHOLDER --- */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <Image 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200" 
          alt="Banner Makanan"
          fill
          priority
          className="object-cover pointer-events-none select-none"
        />
      </div>

      {/* --- LAYER 2: VIDEO BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
        <iframe
          className="w-full h-[200%] -translate-y-1/4 scale-150 sm:h-[300%] sm:-translate-y-1/3"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&modestbranding=1`}
          title="YouTube Video Background"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          onLoad={() => setVideoLoaded(true)}
        ></iframe>
      </div>

      {/* --- LAYER 3: OVERLAY GRADIENT --- */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />
      
      {/* --- LAYER 4: TEKS & KONTEN --- */}
      <div className="absolute inset-0 z-30 flex flex-col justify-center px-6 md:px-12 text-white pointer-events-none select-none">
        <div className="max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-black mb-4 drop-shadow-2xl uppercase italic tracking-tighter leading-[0.9] sm:leading-none">
            Fiverecipe's
          </h2>
          <p className="text-xs md:text-xl text-gray-200 max-w-lg drop-shadow-md font-light leading-relaxed opacity-90">
            Jelajahi ribuan resep autentik dari para pencipta rasa di seluruh penjuru negeri. Temukan inspirasi, ciptakan keajaiban.
          </p>
        </div>
      </div>

    </section>
  );
}
