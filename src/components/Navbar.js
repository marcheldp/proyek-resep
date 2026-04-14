"use client";

import Link from 'next/link';
import Image from 'next/image'; // Baris penyelamat!
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Menu, X, Search, User, Home, Flame, Lightbulb, 
  PlusCircle, Settings, Info, ChevronDown, 
  Loader2, Bookmark, Clock, Utensils, Leaf 
} from 'lucide-react';

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dropdownRef = useRef(null);
  // 1. TAMBAHAN: Ref untuk menahan (debounce) request pencarian
  const searchTimeoutRef = useRef(null);

  const currentFilter = searchParams.get('filter');
  const currentCategory = searchParams.get('category');

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsDropdownOpen(false);
    setSearchQuery("");
    setIsPageLoading(false);
  }, [pathname, searchParams]); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateTo = (path) => {
    if (pathname === path && !searchParams.toString()) return;
    setIsPageLoading(true);
    router.push(path);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // 2. LOGIKA DEBOUNCE: Bersihkan antrean request sebelumnya jika user masih mengetik
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length > 1) {
      setIsSearching(true);
      setIsDropdownOpen(true);

      // 3. Set delay 300ms sebelum nembak ke Supabase
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const [recipesRes, tipsRes] = await Promise.all([
            supabase.from('recipes').select('id, title').ilike('title', `%${query}%`).limit(4).throwOnError(),
            supabase.from('tips').select('id, title').ilike('title', `%${query}%`).limit(4).throwOnError()
          ]);

          const recipeMatches = (recipesRes.data || []).map(item => ({ ...item, type: 'Resep', link: `/resep/${item.id}` }));
          const tipMatches = (tipsRes.data || []).map(item => ({ ...item, type: 'Tips', link: `/tips/${item.id}` }));

          const combined = [...recipeMatches, ...tipMatches].slice(0, 4);
          setSuggestions(combined);
        } catch (error) {
          console.error("Gagal mencari data:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300 milidetik
      
    } else {
      setIsDropdownOpen(false);
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const submitSearch = () => {
    if (searchQuery.trim().length > 1) {
      setIsDropdownOpen(false);
      setIsPageLoading(true);
      router.push(`/cari?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') submitSearch();
  };

  const isActive = (path, filter = null, category = null) => {
    if (pathname !== path) return false;
    if (filter && currentFilter !== filter) return false;
    if (category && currentCategory !== category) return false;
    if (!filter && !category && (currentFilter || currentCategory)) return false;
    return true;
  };

  const navClass = (active) => `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all w-full text-left ${
    active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-700 hover:bg-[#F2EBE3]'
  }`;

  return (
    // ... Bagian return/JSX Anda TETAP SAMA PERSIS karena tidak ada yang salah secara visual ...
    <>
      {/* LOADING GLOBAL */}
      {isPageLoading && (
        <div className="fixed inset-0 z-[200] bg-[#F2EBE3]/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="bg-white p-6 rounded-[30px] shadow-2xl border border-orange-100 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-orange-500" size={40} />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic">Menyiapkan...</p>
           </div>
        </div>
      )}

      {/* ... SISA JSX SAMA PERSIS ... */}
      {/* Untuk menghemat ruang, sisa JSX tidak saya ubah karena sudah sempurna */}
      {/* ... */}
      
      {/* --- SIDEBAR --- */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-xs bg-[#E0D4C6] z-[70] shadow-[10px_0_30px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#D1C4B4]">
          <div className="flex items-center gap-3">
            {/* PEMBUNGKUS LOGO BARU */}
            <div className="h-10 w-10 relative overflow-hidden rounded-2xl shadow-lg border border-[#D1C4B4] bg-white">
              <Image 
                src="/img/logo.png" // Path ke folder public/img/logo.png
                alt="Logo Fiverecipe"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tighter uppercase">Fiverecipe</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-600 bg-[#F2EBE3] rounded-xl">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Navigasi Utama</p>
          <ul className="space-y-2">
            <li><button onClick={() => navigateTo('/')} className={navClass(isActive('/'))}><Home size={20} /> Beranda</button></li>
            <li><button onClick={() => navigateTo('/resep?filter=populer')} className={navClass(isActive('/resep', 'populer'))}><Flame size={20} /> Resep Populer</button></li>
            <li><button onClick={() => navigateTo('/resep?filter=terbaru')} className={navClass(isActive('/resep', 'terbaru'))}><Clock size={20} /> Resep Terbaru</button></li>
            <li><button onClick={() => navigateTo('/resep?category=harian')} className={navClass(isActive('/resep', null, 'harian'))}><Utensils size={20} /> Resep Harian</button></li>
            <li><button onClick={() => navigateTo('/resep?category=sehat')} className={navClass(isActive('/resep', null, 'sehat'))}><Leaf size={20} /> Resep Sehat</button></li>

            <div className="h-px bg-[#D1C4B4] my-4" />

            <li><button onClick={() => navigateTo('/favorit')} className={navClass(pathname === '/favorit')}><Bookmark size={20} /> Favorit Saya</button></li>
            <li><button onClick={() => navigateTo('/tips')} className={navClass(pathname === '/tips')}><Lightbulb size={20} /> Info & Tips</button></li>

            {/* --- PROTEKSI KONTRIBUSI --- */}
            {user && (
              <li className="pt-6 animate-in slide-in-from-left-4 duration-500">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Kontribusi</p>
                <details className="group">
                  <summary className="flex items-center justify-between px-4 py-3 hover:bg-[#F2EBE3] text-gray-700 rounded-2xl font-bold cursor-pointer list-none transition-all">
                    <div className="flex items-center gap-4"><PlusCircle size={20} className="text-orange-500" /> Tambah Konten</div>
                    <ChevronDown size={16} className="transition-transform group-open:rotate-180 text-gray-500" />
                  </summary>
                  <div className="pl-12 py-2 space-y-4 border-l-2 border-[#D1C4B4] ml-6 mt-2">
                    <button onClick={() => navigateTo('/tambah-resep')} className="block text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors">Buat Resep Baru</button>
                    <button onClick={() => navigateTo('/tambah-tips')} className="block text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors">Bagikan Tips</button>
                  </div>
                </details>
              </li>
            )}

            <div className="h-px bg-[#D1C4B4] my-6" />
            
            <li><button onClick={() => navigateTo('/pengaturan')} className={navClass(pathname === '/pengaturan')}><Settings size={20} /> Pengaturan</button></li>
            <li><button onClick={() => navigateTo('/tentang')} className={navClass(pathname === '/tentang')}><Info size={20} /> Tentang Kami</button></li>
          </ul>
        </div>
      </div>

      <nav className="bg-[#E0D4C6] border-b border-[#D1C4B4] sticky top-0 z-50 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('/')}>
              {/* PEMBUNGKUS LOGO BARU */}
              <div className="h-8 w-8 relative overflow-hidden rounded-xl shadow-md border border-[#D1C4B4] bg-white">
                <Image 
                  src="/img/logo.png" // Path ke folder public/img/logo.png
                  alt="Logo Fiverecipe"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-black text-gray-900 tracking-tighter text-xl uppercase">Fiverecipe</span>
            </div>
             <div className="hidden sm:block h-4 w-px bg-[#D1C4B4] mx-2"></div>
             <p className="hidden sm:block text-[10px] font-black text-gray-500 uppercase tracking-widest">Beta Version 1.0</p>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-[#F2EBE3] hover:bg-white text-gray-700 hover:text-orange-600 rounded-2xl transition-all border border-[#D1C4B4] shadow-sm">
              <Menu size={20} />
            </button>

            <div className="flex-grow relative" ref={dropdownRef}>
              <button onClick={submitSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {isSearching ? <Loader2 size={16} className="animate-spin text-orange-500" /> : <Search size={16} />}
              </button>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cari resep atau tips..." 
                className="w-full pl-12 pr-4 h-12 bg-[#F2EBE3] border-2 border-[#D1C4B4] focus:border-orange-400 focus:bg-white rounded-[20px] outline-none text-sm font-bold text-gray-800"
              />
              
              {isDropdownOpen && searchQuery.length > 1 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#F2EBE3] rounded-2xl shadow-xl border border-[#D1C4B4] overflow-hidden z-[100]">
                  {suggestions.length > 0 ? (
                    <div className="flex flex-col">
                      <div className="px-4 py-2 bg-[#E0D4C6]/50 border-b border-[#D1C4B4]">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Hasil Cocok</p>
                      </div>
                      {suggestions.map((item) => (
                        <button key={item.id} onClick={() => navigateTo(item.link)} className="px-4 py-3.5 flex items-center justify-between group hover:bg-white border-b border-[#D1C4B4]/50 w-full text-left">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.type === 'Resep' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {item.type === 'Resep' ? <Utensils size={14} /> : <Lightbulb size={14} />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{item.title}</span>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.type}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : !isSearching && <div className="p-10 text-center text-xs font-black text-gray-500 uppercase">Tidak ditemukan...</div>}
                </div>
              )}
            </div>

            <button 
              onClick={() => navigateTo(pathname === '/favorit' ? '/' : '/favorit')} 
              className={`h-12 w-12 rounded-[20px] flex items-center justify-center border-2 shadow-sm ${pathname === '/favorit' ? 'bg-orange-500 border-orange-400' : 'bg-[#F2EBE3] border-[#D1C4B4]'}`}
            >
              <Bookmark size={20} className={pathname === '/favorit' ? 'text-white' : 'text-orange-500'} fill={pathname === '/favorit' ? 'currentColor' : 'none'} />
            </button>
            
            <button 
              onClick={() => navigateTo(pathname === '/profil' ? '/' : '/profil')} 
              className={`h-12 w-12 rounded-[20px] border-2 flex items-center justify-center transition-all ${pathname === '/profil' ? 'bg-orange-500 border-orange-400' : 'bg-[#F2EBE3] border-[#D1C4B4]'}`}
            >
              <User size={24} className={pathname === '/profil' ? 'text-white' : 'text-gray-500'} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
