"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  LogOut, 
  Lock, 
  User as UserIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Calendar,
  ChefHat,
  RefreshCcw,
  BookOpen,
  UtensilsCrossed,
  Heart,
  Bookmark,
  Star,
  Eye,
  ChevronDown
} from 'lucide-react';

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [myTips, setMyTips] = useState([]);
  const [view, setView] = useState('login'); 
  
  // State untuk Dropdown Masakan Saya
  const [isHarianOpen, setIsHarianOpen] = useState(false);
  const [isSehatOpen, setIsSehatOpen] = useState(false);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const internalDomain = "@fiverecipe.app";

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchMyContent(session.user.id);
    }
    setLoading(false);
  }

  async function fetchMyContent(userId) {
    const [recipesRes, tipsRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('tips').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);
    
    if (recipesRes.data) setMyRecipes(recipesRes.data);
    if (tipsRes.data) setMyTips(tipsRes.data);
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    if (view === 'register' && password !== confirmPassword) {
      alert("❌ Password dan Verifikasi Password tidak cocok!");
      setAuthLoading(false);
      return;
    }

    const secretEmail = `${username.toLowerCase()}${internalDomain}`;

    if (view === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: secretEmail,
        password: password,
        options: { data: { display_name: username } }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          alert("⚠️ Username '" + username + "' sudah dipakai! Gunakan nama lain.");
        } else {
          alert("Gagal Daftar: " + error.message);
        }
      } else {
        alert("✅ Akun Berhasil Dibuat!");
        setUser(data.user);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: secretEmail,
        password: password
      });
      if (error) alert("❌ Username atau Password salah!");
      else {
        setUser(data.user);
        fetchMyContent(data.user.id);
      }
    }
    setAuthLoading(false);
  };

  const handleDelete = async (id, table) => {
    if (confirm("Yakin ingin menghapus konten ini selamanya? (Semua like dan favorit di artikel ini juga akan hangus!)")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) {
         fetchMyContent(user.id);
      } else {
         alert("Gagal menghapus.");
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyRecipes([]);
    setMyTips([]);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const totalLikes = 
    myRecipes.reduce((sum, item) => sum + (item.likes || 0), 0) + 
    myTips.reduce((sum, item) => sum + (item.likes || 0), 0);

  const totalFavorites = 
    myRecipes.reduce((sum, item) => sum + (item.favorites || 0), 0) + 
    myTips.reduce((sum, item) => sum + (item.favorites || 0), 0);

  // --- PEMISAHAN KATEGORI RESEP ---
  const harianRecipes = myRecipes.filter(r => r.category !== 'sehat'); 
  const sehatRecipes = myRecipes.filter(r => r.category === 'sehat');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  // --- VIEW: LOGIN / REGISTER ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[45px] p-10 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
             <div className="h-20 w-20 bg-gradient-to-tr from-orange-500 to-red-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-orange-200 rotate-6 transition-transform hover:rotate-0">
                <ChefHat size={42} strokeWidth={2.5} />
             </div>
          </div>
          
          <h2 className="text-4xl font-black text-center mb-2 uppercase tracking-tighter text-gray-900 italic">
            {view === 'login' ? 'Masuk' : 'Daftar'}
          </h2>
          <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10">
            Fiverecipe Digital
          </p>
          
          <form className="space-y-4" onSubmit={handleAuth}>
            <div className="relative">
              <UserIcon className="absolute left-5 top-5 text-gray-400" size={18} />
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-5 pl-14 bg-gray-50 rounded-3xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all" required />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-5 top-5 text-gray-400" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-5 pl-14 bg-gray-50 rounded-3xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all" required />
            </div>

            {view === 'register' && (
              <div className="relative animate-in slide-in-from-top-2">
                <RefreshCcw className="absolute left-5 top-5 text-orange-400" size={18} />
                <input type="password" placeholder="Verifikasi Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-5 pl-14 bg-orange-50/30 rounded-3xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm transition-all border border-orange-100" required />
              </div>
            )}
            
            <button disabled={authLoading} className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl shadow-2xl shadow-orange-200 mt-6 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : (view === 'login' ? 'MULAI MEMASAK' : 'GABUNG SEKARANG')}
            </button>
          </form>

          <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full mt-10 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-orange-600 transition-colors">
            {view === 'login' ? 'Belum punya ID? Buat Akun' : 'Sudah punya ID? Masuk Sini'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD PROFIL ---
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 h-64 w-full rounded-b-[70px] shadow-lg flex items-center justify-center relative overflow-hidden">
         <h2 className="text-white/10 font-black text-[120px] tracking-tighter uppercase italic select-none absolute -bottom-10">CHEF</h2>
      </div>
      
      <div className="max-w-md mx-auto px-6 -mt-28">
        <div className="bg-white rounded-[50px] p-8 shadow-2xl text-center relative border border-white">
          
          <div className="h-36 w-36 bg-white rounded-[50px] mx-auto -mt-28 border-[10px] border-white shadow-2xl flex items-center justify-center overflow-hidden relative z-20 group">
            <div className="bg-orange-50 w-full h-full flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-all">
               <UserIcon size={56} strokeWidth={2.5} />
            </div>
          </div>
          
          <h1 className="text-3xl font-black mt-6 text-gray-900 tracking-tighter italic uppercase">
            @{user.user_metadata?.display_name || user.email.split('@')[0]}
          </h1>
          
          <div className="flex items-center justify-center gap-2 mt-2 text-gray-400">
             <Calendar size={14} className="text-orange-400" />
             <p className="text-[10px] font-black uppercase tracking-widest">
               Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-8">
             <div className="bg-orange-50/80 p-4 rounded-[28px] border border-orange-100/50 flex flex-col items-center justify-center shadow-sm">
                <p className="text-2xl font-black text-orange-600 tracking-tighter">{myRecipes.length}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1"><UtensilsCrossed size={10} className="text-orange-400"/> Resep</p>
             </div>
             <div className="bg-blue-50/80 p-4 rounded-[28px] border border-blue-100/50 flex flex-col items-center justify-center shadow-sm">
                <p className="text-2xl font-black text-blue-600 tracking-tighter">{myTips.length}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1"><BookOpen size={10} className="text-blue-400"/> Tips</p>
             </div>
             <div className="bg-pink-50/80 p-4 rounded-[28px] border border-pink-100/50 flex flex-col items-center justify-center shadow-sm">
                <p className="text-2xl font-black text-pink-600 tracking-tighter">{totalLikes}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1"><Heart size={10} className="text-pink-400"/> Total Likes</p>
             </div>
             <div className="bg-yellow-50/80 p-4 rounded-[28px] border border-yellow-200/50 flex flex-col items-center justify-center shadow-sm">
                <p className="text-2xl font-black text-yellow-600 tracking-tighter">{totalFavorites}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1"><Bookmark size={10} className="text-yellow-500"/> Difavoritkan</p>
             </div>
          </div>

          <div className="mt-10 text-left space-y-8">
            
            {/* --- BAGIAN MASAKAN SAYA (DROPDOWN) --- */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                 <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2 italic">
                    <UtensilsCrossed size={14} className="text-orange-500" /> Masakan Saya
                 </h3>
                 <Link href="/tambah-resep" className="h-8 w-8 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Plus size={16} />
                 </Link>
              </div>

              <div className="space-y-4">
                {/* 1. Dropdown Resep Harian */}
                <div>
                  <button 
                    onClick={() => setIsHarianOpen(!isHarianOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-[24px] bg-cyan-700 text-white shadow-md active:scale-95 transition-all"
                  >
                    <span className="font-black text-sm uppercase tracking-widest">Resep Harian <span className="text-cyan-200 ml-1">({harianRecipes.length})</span></span>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${isHarianOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isHarianOpen && (
                    <div className="mt-3 space-y-3 px-1 animate-in slide-in-from-top-2 duration-300">
                      {harianRecipes.length > 0 ? harianRecipes.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-4 rounded-3xl flex justify-between items-center border border-gray-100">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-cyan-600 font-black text-xs border border-gray-100 shadow-sm">{item.title[0]}</div>
{/* Di dalam harianRecipes.map */}
<div className="flex flex-col">
  <p className="font-black text-sm text-gray-800 tracking-tighter line-clamp-1 uppercase">{item.title}</p>
  <p className="text-[9px] font-bold text-gray-400 mt-1 flex gap-2.5">
    {/* 1. VIEW */}
    <span className="flex items-center gap-1 text-blue-500">
      <Eye size={10}/> {item.views || 0}
    </span>
    {/* 2. LIKE */}
    <span className="flex items-center gap-1 text-pink-500">
      <Heart size={10} fill={item.likes > 0 ? "currentColor" : "none"}/> {item.likes || 0}
    </span>
    {/* 3. RATING */}
    <span className="flex items-center gap-1 text-orange-500">
      <Star size={10} fill="currentColor"/> {item.rating_avg || 0}
    </span>
    {/* 4. FAVORIT */}
    <span className="flex items-center gap-1 text-yellow-600">
      <Bookmark size={10}/> {item.favorites || 0}
    </span>
  </p>
</div>
                          </div>
                          <div className="flex gap-1">
                            <Link 
                              href={`/resep/edit/${item.id}`} 
                              className="p-2.5 text-gray-400 hover:text-cyan-600 transition-colors"
                            >
                              <Edit3 size={16} />
                            </Link>
                            <button onClick={() => handleDelete(item.id, 'recipes')} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-xs text-gray-400 italic py-3">Belum ada resep harian.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Dropdown Resep Sehat */}
                <div>
                  <button 
                    onClick={() => setIsSehatOpen(!isSehatOpen)}
                    className="w-full flex items-center justify-between p-4 rounded-[24px] bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
                  >
                    <span className="font-black text-sm uppercase tracking-widest">Resep Sehat <span className="text-emerald-200 ml-1">({sehatRecipes.length})</span></span>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${isSehatOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isSehatOpen && (
                    <div className="mt-3 space-y-3 px-1 animate-in slide-in-from-top-2 duration-300">
                      {sehatRecipes.length > 0 ? sehatRecipes.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-4 rounded-3xl flex justify-between items-center border border-gray-100">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 font-black text-xs border border-gray-100 shadow-sm">{item.title[0]}</div>
{/* Di dalam sehatRecipes.map */}
<div className="flex flex-col">
  <p className="font-black text-sm text-gray-800 tracking-tighter line-clamp-1 uppercase">{item.title}</p>
  <p className="text-[9px] font-bold text-gray-400 mt-1 flex gap-2.5">
    {/* 1. VIEW */}
    <span className="flex items-center gap-1 text-blue-500">
      <Eye size={10}/> {item.views || 0}
    </span>
    {/* 2. LIKE */}
    <span className="flex items-center gap-1 text-pink-500">
      <Heart size={10} fill={item.likes > 0 ? "currentColor" : "none"}/> {item.likes || 0}
    </span>
    {/* 3. RATING */}
    <span className="flex items-center gap-1 text-orange-500">
      <Star size={10} fill="currentColor"/> {item.rating_avg || 0}
    </span>
    {/* 4. FAVORIT */}
    <span className="flex items-center gap-1 text-yellow-600">
      <Bookmark size={10}/> {item.favorites || 0}
    </span>
  </p>
</div>
                          </div>
                          <div className="flex gap-1">
                            <Link 
                              href={`/resep/edit/${item.id}`} 
                              className="p-2.5 text-gray-400 hover:text-emerald-600 transition-colors"
                            >
                              <Edit3 size={16} />
                            </Link>
                            <button onClick={() => handleDelete(item.id, 'recipes')} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )) : (
                        <p className="text-center text-xs text-gray-400 italic py-3">Belum ada resep sehat.</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* --- BAGIAN TIPS --- */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                 <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2 italic">
                    <BookOpen size={14} className="text-blue-500" /> Tips Saya
                 </h3>
                 <Link href="/tambah-tips" className="h-8 w-8 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Plus size={16} />
                 </Link>
              </div>

              <div className="space-y-3">
                {myTips.map((item) => (
                  <div key={item.id} className="bg-gray-50/50 p-4 rounded-3xl flex justify-between items-center border border-gray-100">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-500 font-black text-xs border border-gray-100">T</div>
                       <div className="flex flex-col">
                          <p className="font-black text-sm text-gray-800 tracking-tighter line-clamp-1 uppercase">{item.title}</p>
                          <p className="text-[10px] font-bold text-blue-500 mt-1 flex items-center gap-1.5">
                            <Eye size={12}/> {item.views || 0} <span className="text-gray-300 font-light lowercase">pembaca</span>
                          </p>
                       </div>
                    </div>
                    <div className="flex gap-1">
                      <Link 
                        href={`/tips/edit/${item.id}`} 
                        className="p-2.5 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit3 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(item.id, 'tips')} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {myTips.length === 0 && <p className="text-center text-xs text-gray-400 italic py-3">Belum ada tips yang dibuat.</p>}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 space-y-3">
            <button onClick={handleLogout} className="w-full py-5 bg-red-50 text-red-600 font-black rounded-[30px] active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-sm">
              <LogOut size={18} /> Keluar Aplikasi
            </button>
            <button onClick={handleLogout} className="w-full py-4 text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-gray-600 transition-colors">
              Ganti Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}