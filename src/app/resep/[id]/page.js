"use client";

import Link from 'next/link';
import Image from 'next/image'; // 1. OPTIMASI: Import Image
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
 Share2, Star, ArrowLeft, Send, Utensils, Zap,
 Activity, Droplets, Leaf, MessageSquare, Bookmark, Heart, Loader2, User, Flame, X,
 MoreVertical, Edit2, Trash2
} from 'lucide-react';

export default function DetailResep({ params }) {
 const resolvedParams = use(params);
 const recipeId = resolvedParams.id;
 const router = useRouter();

 const [resep, setResep] = useState(null);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [user, setUser] = useState(null);
 const [comments, setComments] = useState([]);
 const [newComment, setNewComment] = useState("");
 const [replyingTo, setReplyingTo] = useState(null);
 const [commentLikes, setCommentLikes] = useState([]);
 const [activeMenu, setActiveMenu] = useState(null);
 const [editingCommentId, setEditingCommentId] = useState(null);
 const [editContent, setEditContent] = useState("");
 
 const [hasLiked, setHasLiked] = useState(false);
 const [hasFavorited, setHasFavorited] = useState(false);
 const [userRating, setUserRating] = useState(0);
 const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });

 useEffect(() => {
   // 2. KEAMANAN MEMORI: Flag untuk mengecek apakah komponen masih ada di layar
   let isMounted = true;

   // Reset state antar resep
   setUserRating(0);
   setHasLiked(false);
   setHasFavorited(false);
   setRatingStats({ avg: 0, count: 0 });

   async function initPage() {
     setLoading(true);
     const { data: { session } } = await supabase.auth.getSession();
     const currentUser = session?.user || null;
     
     if (!isMounted) return; // Hentikan eksekusi jika komponen sudah di-unmount
     setUser(currentUser);

     try {
       // 3. KEAMANAN QUERY: Tambahkan penanganan error pada RPC
       await supabase.rpc('increment_views', { row_id: recipeId }).throwOnError();
     } catch (err) {
       console.warn("Gagal menambah view:", err); // Tidak perlu dibatalkan jika views gagal
     }

     await refreshAllData(currentUser, isMounted);
     
     if (isMounted) {
       setTimeout(() => setLoading(false), 800);
     }
   }

   initPage();

   // Fungsi cleanup saat komponen dihancurkan
   return () => { isMounted = false; };
 }, [recipeId]);

 // Tambahkan parameter isMounted agar kita tahu apakah data perlu di-set atau tidak
 async function refreshAllData(currentUser = user, isMounted = true) {
   try {
     const [recipeRes, commentRes, ratingRes, likeRes, myRateRes, favRes, myCommentLikesRes] = await Promise.all([
       supabase.from('recipes').select('*').eq('id', recipeId).single().throwOnError(), // Tambahkan throwOnError pada yang kritikal
       supabase.from('comments').select('*').eq('recipe_id', recipeId),
       supabase.from('ratings').select('score').eq('recipe_id', recipeId),
       currentUser ? supabase.from('recipe_likes').select('*').eq('recipe_id', recipeId).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null }),
       currentUser ? supabase.from('ratings').select('score').eq('recipe_id', recipeId).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null }),
       currentUser ? supabase.from('favorites').select('*').eq('recipe_id', recipeId).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null }),
       currentUser ? supabase.from('comment_likes').select('comment_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] })
     ]);

     if (!isMounted) return; // Jika user sudah kabur, jangan update state

     if (recipeRes.data) setResep(recipeRes.data);
     
     if (commentRes.data) {
       const sortedComments = commentRes.data.sort((a, b) => {
         if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
         return new Date(b.created_at) - new Date(a.created_at);
       });
       setComments(sortedComments);
     }

     if (myCommentLikesRes.data) {
       setCommentLikes(myCommentLikesRes.data.map(cl => cl.comment_id));
     }
     
     if (ratingRes.data && ratingRes.data.length > 0) {
       const total = ratingRes.data.reduce((acc, curr) => acc + curr.score, 0);
       setRatingStats({ avg: (total / ratingRes.data.length).toFixed(1), count: ratingRes.data.length });
     } else {
       setRatingStats({ avg: 0, count: 0 });
     }

     setHasLiked(!!likeRes?.data);
     setHasFavorited(!!favRes?.data);
     setUserRating(myRateRes?.data ? myRateRes.data.score : 0);
     
   } catch (err) {
     console.error("Gagal refresh data utama:", err);
   }
 }

 // ... (Fungsi handleToggleLike, handleToggleFavorite, handleRate, dll. biarkan sama persis seperti sebelumnya) ...
 const handleToggleLike = async () => {
   if (!user) return alert("Silakan login dulu ya Chef!");
   if (refreshing) return;
   setRefreshing(true);
   try {
     if (hasLiked) {
       const { error: deleteError } = await supabase.from('recipe_likes').delete().eq('recipe_id', recipeId).eq('user_id', user.id);
       if (!deleteError) setHasLiked(false);
     } else {
       const { error: insertError } = await supabase.from('recipe_likes').insert([{ recipe_id: recipeId, user_id: user.id }]);
       if (!insertError) setHasLiked(true);
     }
     await refreshAllData();
   } catch (err) { console.error(err); } finally { setRefreshing(false); }
 };

 const handleToggleFavorite = async () => {
   if (!user) return alert("Silakan login dulu untuk menyimpan resep ini, Chef!");
   if (refreshing) return;
   setHasFavorited(!hasFavorited);
   setRefreshing(true);
   try {
     if (hasFavorited) {
       await supabase.from('favorites').delete().eq('recipe_id', recipeId).eq('user_id', user.id);
     } else {
       await supabase.from('favorites').insert([{ recipe_id: recipeId, user_id: user.id }]);
     }
     await refreshAllData();
   } catch (err) { setHasFavorited(hasFavorited); } finally { setTimeout(() => setRefreshing(false), 500); }
 };

 const handleRate = async (score) => {
   if (!user) return alert("Hanya koki terdaftar yang bisa memberi rating!");
   if (refreshing) return;
   setRefreshing(true);
   setUserRating(score);
   try {
     const { error } = await supabase.from('ratings').upsert({ recipe_id: recipeId, user_id: user.id, score: score }, { onConflict: 'recipe_id,user_id' });
     if (error) {
       alert("Gagal menyimpan rating.");
       await refreshAllData(); return;
     }
     await refreshAllData();
   } catch (err) { console.error(err); } finally { setTimeout(() => setRefreshing(false), 800); }
 };

 const handlePostComment = async () => {
   if (!newComment || refreshing) return;
   setRefreshing(true);
   const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || "Anonim";
   try {
     const { error } = await supabase.from('comments').insert([{ recipe_id: recipeId, content: newComment, user_name: displayName, user_id: user.id, parent_id: replyingTo ? replyingTo.id : null }]);
     if (error) { alert("Gagal kirim pesan: " + error.message); return; }
     setNewComment(""); setReplyingTo(null); await refreshAllData();
   } catch (err) { console.error(err); } finally { setTimeout(() => setRefreshing(false), 500); }
 };

 const handleLikeComment = async (commentId, currentLikes) => {
   if (!user) return alert("Hanya koki login yang bisa kasih jempol!");
   const isLiked = commentLikes.includes(commentId);
   setCommentLikes(prev => isLiked ? prev.filter(id => id !== commentId) : [...prev, commentId]);
   setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: isLiked ? Math.max(0, (c.likes || 1) - 1) : (c.likes || 0) + 1 } : c));
   try {
     if (isLiked) {
       await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
       await supabase.from('comments').update({ likes: Math.max(0, currentLikes - 1) }).eq('id', commentId);
     } else {
       await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: user.id }]);
       await supabase.from('comments').update({ likes: currentLikes + 1 }).eq('id', commentId);
     }
   } catch (err) { await refreshAllData(); }
 };
 
 const handleDeleteComment = async (commentId) => {
   if (!window.confirm("Yakin ingin menghapus komentar ini, Chef?")) return;
   setRefreshing(true);
   try {
     await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
     setActiveMenu(null); await refreshAllData();
   } catch (err) { console.error(err); } finally { setTimeout(() => setRefreshing(false), 500); }
 };

 const startEditing = (comment) => { setEditingCommentId(comment.id); setEditContent(comment.content); setActiveMenu(null); };

 const handleUpdateComment = async (commentId) => {
   if (!editContent.trim()) return;
   setRefreshing(true);
   try {
     await supabase.from('comments').update({ content: editContent }).eq('id', commentId).eq('user_id', user.id);
     setEditingCommentId(null); await refreshAllData();
   } catch (err) { console.error(err); } finally { setTimeout(() => setRefreshing(false), 500); }
 };

 const formatFullDate = (dateString) => {
   if (!dateString) return "...";
   const date = new Date(dateString);
   return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
 };

 const displayAuthor = resep?.user_name || resep?.author || 'koki_handal';

 if (loading) return (
   <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F2EBE3]">
     <Loader2 className="animate-spin text-orange-500 mb-4" size={50} />
     <p className="font-black text-xs uppercase tracking-[0.4em] text-gray-500 italic">Menyiapkan Hidangan...</p>
   </div>
 );

 if (!resep) return <div className="p-20 text-center font-black uppercase italic min-h-screen bg-[#F2EBE3]">Resep tidak ditemukan.</div>;


 return (
   <div className="bg-[#F2EBE3] min-h-screen pb-24 relative">
     {/* ... (Modal Loading dan Header biarkan sama) ... */}
     {refreshing && (
       <div className="fixed inset-0 z-[90] bg-white/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white/90 p-6 rounded-full shadow-2xl border border-orange-100">
             <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
       </div>
     )}

     <header className="bg-[#E0D4C6] px-6 py-4 border-b border-[#D1C4B4] flex items-center justify-between relative z-10">
       <Link href="/resep" className="p-3 bg-[#F2EBE3] border border-[#D1C4B4] rounded-2xl text-gray-600 active:scale-90 transition-all hover:text-orange-500 inline-block">
         <ArrowLeft size={20} />
       </Link>
       <div className="flex flex-col items-center max-w-[200px]">
         <h1 className="text-[10px] font-black text-gray-900 tracking-widest uppercase italic truncate w-full text-center">
           {resep.title}
         </h1>
         <p className="text-[7px] font-bold text-gray-500 uppercase tracking-tighter">
           {formatFullDate(resep.created_at)}
         </p>
       </div>
       <button onClick={handleToggleFavorite} className={`p-3 bg-white border rounded-2xl active:scale-90 transition-all shadow-sm ${hasFavorited ? 'border-yellow-400 text-yellow-500' : 'border-orange-200 text-orange-500'}`}>
          <Bookmark size={20} fill={hasFavorited ? "currentColor" : "none"} />
       </button>
     </header>

     {/* --- 4. OPTIMASI GAMBAR HERO --- */}
     <div className="w-full aspect-video relative overflow-hidden bg-[#E0D4C6]">
       <Image
         src={resep.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1200'}
         alt={resep.title}
         fill
         priority // Gambar hero harus langsung di-load
         sizes="100vw"
         className="object-cover"
       />
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
       <div className="absolute bottom-12 left-6 right-6 z-20">
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">Recipe</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">{resep.title}</h2>
       </div>
     </div>

     <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
       {/* ... (Stats Card, Nutrisi, Username, Tentang Masakan, Bahan-Bahan biarkan SAMA PERSIS) ... */}
       
       {/* STATS CARD */}
       <div className="bg-[#E0D4C6] rounded-[40px] shadow-xl p-8 flex items-center justify-around border border-[#D1C4B4]">
         <div className="text-center">
           <p className="text-xl font-black text-gray-900 leading-none">{resep.views || 0}</p>
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Views</p>
         </div>
         <div className="h-8 w-px bg-[#D1C4B4]"></div>
         <div className="text-center">
           <p className="text-xl font-black text-orange-500 flex items-center gap-1 leading-none justify-center">
             <Star size={16} fill="currentColor" /> {ratingStats.avg}
           </p>
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">oleh {ratingStats.count} koki</p>
         </div>
         <div className="h-8 w-px bg-[#D1C4B4]"></div>
         <div className="text-center">
             <button
               onClick={handleToggleLike}
               className={`text-xl font-black flex items-center gap-1 leading-none justify-center active:scale-125 transition-all ${
                 hasLiked ? 'text-pink-500' : 'text-gray-400'
               }`}
             >
                <Heart size={16} fill={hasLiked ? "currentColor" : "none"} />
                {resep.likes || 0}
             </button>
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Likes</p>
         </div>
         <div className="h-8 w-px bg-[#D1C4B4]"></div>
         <div className="text-center">
           <button onClick={() => document.getElementById('diskusi').scrollIntoView({behavior:'smooth'})} className="text-xl font-black text-gray-900 leading-none flex items-center gap-1">
              <MessageSquare size={16} /> {comments.length}
           </button>
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Diskusi</p>
         </div>
       </div>

       {/* NUTRISI */}
       <div className="mt-6">
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-4 text-center italic">Informasi Nutrisi / Sajian</h3>
         <div className="grid grid-cols-5 gap-3">
           {[
             { label: 'Kalori', val: resep.calories, icon: <Zap size={14} /> },
             { label: 'Protein', val: resep.protein, icon: <Utensils size={14} /> },
             { label: 'Karbo', val: resep.carbs, icon: <Activity size={14} /> },
             { label: 'Lemak', val: resep.fat, icon: <Droplets size={14} /> },
             { label: 'Serat', val: resep.fiber, icon: <Leaf size={14} /> }
           ].map((n, i) => (
             <div key={i} className="bg-[#E0D4C6]/60 rounded-3xl p-4 text-center border border-[#D1C4B4] group hover:bg-[#E0D4C6] transition-all">
               <div className="flex justify-center mb-2 text-orange-500 group-hover:scale-125 transition-transform">{n.icon}</div>
               <p className="text-[7px] font-black text-gray-500 uppercase mb-1">{n.label}</p>
               <p className="font-black text-gray-900 text-xs">{n.val || '0g'}</p>
             </div>
           ))}
         </div>
       </div>

       {/* USERNAME TENGAH SEBAGAI CREDIT UTAMA */}
       <div className="mt-12 flex flex-col items-center">
          <div className="flex items-center gap-2 px-6 py-2 bg-[#E0D4C6] border border-[#D1C4B4] rounded-full shadow-sm animate-in fade-in zoom-in duration-700">
             <div className="h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-[10px] uppercase">
               {displayAuthor[0]}
             </div>
             <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest italic">
               Resep Oleh @{displayAuthor}
             </p>
          </div>
       </div>

       <section className="mt-6 bg-[#E0D4C6]/40 -mx-6 px-10 py-16 text-center border-y border-[#D1C4B4]">
         <h2 className="text-2xl font-medium text-gray-800 mb-6 tracking-tight uppercase text-center">Tentang Masakan</h2>
         <p className="text-gray-700 leading-relaxed text-sm md:text-base max-w-2xl mx-auto text-left font-light italic break-words">
           {resep.about || resep.description}
         </p>
       </section>

       <section className="mt-20 px-4 md:px-10">
         <h2 className="text-2xl font-medium text-gray-800 mb-10 text-center tracking-tight uppercase">Bahan-Bahan</h2>
         <div className="space-y-4">
           {resep.ingredients?.map((ing, i) => (
             <p key={i} className="text-gray-700 text-sm md:text-base font-light leading-relaxed border-b border-[#D1C4B4]/30 pb-2 italic break-words">• {ing}</p>
           ))}
         </div>
       </section>

       <section className="mt-24 px-4 md:px-10 border-b border-[#D1C4B4] pb-12">
         <h2 className="text-2xl font-medium text-gray-800 mb-12 text-center tracking-tight uppercase">Cara Membuat</h2>
         <div className="space-y-12">
           {resep.steps?.map((step, i) => {
             let stepText = "";
             let stepImage = null;

             try {
               const parsedStep = typeof step === 'string' && step.startsWith('{')
                 ? JSON.parse(step)
                 : step;

               if (typeof parsedStep === 'object' && parsedStep !== null) {
                 stepText = parsedStep.text || "";
                 stepImage = parsedStep.step_image_url || null;
               } else {
                 stepText = parsedStep;
               }
             } catch (e) {
               stepText = step;
             }

             return (
               <div key={i} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="flex gap-6">
                   <span className="text-lg font-bold text-orange-500 shrink-0">{i + 1}.</span>
                   <div className="flex-1 space-y-4">
                     {/* 5. OPTIMASI GAMBAR LANGKAH */}
                     {stepImage && (
                       <div className="w-full max-w-lg aspect-video relative rounded-[30px] overflow-hidden border-4 border-white shadow-md">
                         <Image
                           src={stepImage}
                           alt={`Langkah ${i + 1}`}
                           fill
                           sizes="(max-width: 768px) 100vw, 500px"
                           className="object-cover"
                         />
                       </div>
                     )}
                     <p className="text-gray-700 text-sm md:text-base leading-relaxed font-light break-words">
                       {stepText}
                     </p>
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       </section>

       {/* ... (Rating & Diskusi biarkan persis seperti yang Anda buat sebelumnya, tidak ada perubahan logika di bawah ini) ... */}
       
       {/* RATING SEKSI */}
       <section className="mt-12 py-16 bg-[#E0D4C6]/30 -mx-6 px-10 text-center border-b border-[#D1C4B4]">
          <h2 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter italic">Bagaimana hasilnya Chef?</h2>
           <div className="flex justify-center gap-3 mt-6">
             {[1, 2, 3, 4, 5].map((star) => (
               <button key={star} onClick={() => handleRate(star)} className="hover:scale-125 transition-all active:scale-150">
                 <Star size={36} className={`${star <= userRating ? 'text-orange-500 fill-orange-500' : 'text-[#D1C4B4]'}`} strokeWidth={1.5} />
               </button>
             ))}
           </div>
          <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Berdasarkan {ratingStats.count} Penilaian Koki</p>
       </section>

       {/* DISKUSI (Versi Super Lengkap dengan Edit & Hapus) */}
       <section id="diskusi" className="mt-16 pb-20">
         <h2 className="text-2xl font-medium text-gray-800 mb-10 text-center tracking-tight uppercase italic">Diskusi Hangat</h2>
         
         <div className="max-h-[500px] overflow-y-auto pr-2 pb-32 mb-8 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D1C4B4] [&::-webkit-scrollbar-thumb]:rounded-full">
           {comments.length > 0 ? (
             comments.filter(c => !c.parent_id).map((c) => (
               <div key={c.id} className={`flex flex-col gap-3 animate-in slide-in-from-bottom-2 bg-white/40 p-5 rounded-3xl border border-white/60 shadow-sm transition-all relative ${activeMenu === c.id || comments.some(r => r.parent_id === c.id && activeMenu === r.id) ? 'z-[100]' : 'z-10'}`}>
                 <div className="flex gap-4 items-start">
                   <div className="h-10 w-10 bg-[#E0D4C6] border border-[#D1C4B4] rounded-full flex items-center justify-center text-orange-600 font-black shadow-sm uppercase shrink-0">{c.user_name?.[0]}</div>
                   <div className="flex-grow">
                     <div className="flex items-center justify-between mb-1 relative">
                       <div className="flex items-center gap-3">
                         <p className="font-bold text-xs text-gray-800 uppercase tracking-tighter">@{c.user_name}</p>
                         <span className="h-1 w-1 bg-[#D1C4B4] rounded-full"></span>
                         <p className="text-[9px] text-gray-500 italic">{new Date(c.created_at).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-center gap-2">
                         {(c.likes || 0) >= 5 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Flame size={10}/> Populer</span>}
                         {user && user.id === c.user_id && (
                           <div className="relative">
                             <button onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)} className="p-1.5 text-gray-400 hover:text-gray-700 bg-white rounded-full shadow-sm active:scale-90 transition-all">
                               <MoreVertical size={16} />
                             </button>
                             {activeMenu === c.id && (
                               <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-[#D1C4B4]/60 shadow-xl rounded-2xl overflow-hidden z-[60] w-32 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                 <button onClick={() => startEditing(c)} className="w-full text-left px-4 py-3.5 text-[10px] font-black text-gray-700 hover:bg-[#F2EBE3] hover:text-orange-600 flex items-center gap-3 uppercase border-b border-[#D1C4B4]/30 transition-colors">
                                   <Edit2 size={14}/> Edit
                                 </button>
                                 <button onClick={() => handleDeleteComment(c.id)} className="w-full text-left px-4 py-3.5 text-[10px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase transition-colors">
                                   <Trash2 size={14}/> Hapus
                                 </button>
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                     {editingCommentId === c.id ? (
                       <div className="mt-2 mb-3">
                         <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white border border-orange-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 resize-none h-20 shadow-inner" />
                         <div className="flex justify-end gap-2 mt-2">
                           <button onClick={() => setEditingCommentId(null)} className="px-4 py-2 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-[#E0D4C6] hover:bg-[#D1C4B4] transition-all rounded-lg">Batal</button>
                           <button onClick={() => handleUpdateComment(c.id)} className="px-4 py-2 text-[9px] font-black text-white uppercase tracking-widest bg-orange-500 hover:bg-orange-600 transition-all rounded-lg">Simpan</button>
                         </div>
                       </div>
                     ) : (
                       <p className="text-gray-700 text-sm font-light leading-relaxed break-words">{c.content}</p>
                     )}
                     {editingCommentId !== c.id && (
                       <div className="flex items-center gap-4 mt-3">
                         <button onClick={() => handleLikeComment(c.id, c.likes || 0)} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-110 ${commentLikes.includes(c.id) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}>
                           <Heart size={14} fill={commentLikes.includes(c.id) ? "currentColor" : "none"} /> {c.likes || 0}
                         </button>
                         <button onClick={() => { setReplyingTo({ id: c.id, user_name: c.user_name }); document.getElementById('input-diskusi').scrollIntoView({behavior:'smooth'}); }} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-all">
                           <MessageSquare size={14} /> Balas
                         </button>
                       </div>
                     )}
                   </div>
                 </div>

                 {comments.filter(reply => reply.parent_id === c.id).length > 0 && (
                   <div className="ml-12 mt-2 space-y-4 border-l-2 border-[#D1C4B4]/50 pl-4">
                     {comments.filter(reply => reply.parent_id === c.id).map(reply => (
                       <div key={reply.id} className="flex gap-3 items-start">
                         <div className="h-7 w-7 bg-[#E0D4C6] rounded-full flex items-center justify-center text-gray-600 font-bold text-[10px] uppercase shrink-0">{reply.user_name?.[0]}</div>
                         <div className="flex-grow">
                           <div className="flex items-center justify-between mb-1 relative">
                             <div className="flex items-center gap-2">
                               <p className="font-bold text-[10px] text-gray-800 uppercase tracking-tighter">@{reply.user_name}</p>
                               <span className="h-1 w-1 bg-[#D1C4B4] rounded-full"></span>
                               <p className="text-[8px] text-gray-500 italic">{new Date(reply.created_at).toLocaleDateString()}</p>
                             </div>
                             {user && user.id === reply.user_id && (
                               <div className="relative">
                                 <button onClick={() => setActiveMenu(activeMenu === reply.id ? null : reply.id)} className="p-1 text-gray-400 hover:text-gray-700 bg-white rounded-full shadow-sm active:scale-90 transition-all">
                                   <MoreVertical size={14} />
                                 </button>
                                 {activeMenu === reply.id && (
                                   <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-[#D1C4B4]/60 shadow-xl rounded-2xl overflow-hidden z-[60] w-32 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                                     <button onClick={() => startEditing(reply)} className="w-full text-left px-4 py-3 text-[10px] font-black text-gray-700 hover:bg-[#F2EBE3] hover:text-orange-600 flex items-center gap-3 uppercase border-b border-[#D1C4B4]/30 transition-colors">
                                       <Edit2 size={14}/> Edit
                                     </button>
                                     <button onClick={() => handleDeleteComment(reply.id)} className="w-full text-left px-4 py-3 text-[10px] font-black text-red-500 hover:bg-red-50 flex items-center gap-3 uppercase transition-colors">
                                       <Trash2 size={14}/> Hapus
                                     </button>
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                           {editingCommentId === reply.id ? (
                             <div className="mt-2 mb-2">
                               <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white border border-orange-300 rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-orange-400 resize-none h-16 shadow-inner" />
                               <div className="flex justify-end gap-2 mt-2">
                                 <button onClick={() => setEditingCommentId(null)} className="px-3 py-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest bg-[#E0D4C6] rounded-md">Batal</button>
                                 <button onClick={() => handleUpdateComment(reply.id)} className="px-3 py-1.5 text-[8px] font-black text-white uppercase tracking-widest bg-orange-500 rounded-md">Simpan</button>
                               </div>
                             </div>
                           ) : (
                             <p className="text-gray-600 text-xs font-light leading-relaxed break-words">{reply.content}</p>
                           )}
                           {editingCommentId !== reply.id && (
                             <div className="flex items-center gap-4 mt-2">
                               <button onClick={() => handleLikeComment(reply.id, reply.likes || 0)} className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all ${commentLikes.includes(reply.id) ? 'text-pink-500' : 'text-gray-400'}`}>
                                 <Heart size={12} fill={commentLikes.includes(reply.id) ? "currentColor" : "none"} /> {reply.likes || 0}
                               </button>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

               </div>
             ))
           ) : (
             <div className="text-center py-10 bg-white/30 rounded-3xl border-2 border-dashed border-[#D1C4B4]">
               <p className="font-black text-[10px] text-gray-500 uppercase tracking-widest italic">Belum ada diskusi, jadilah yang pertama!</p>
             </div>
           )}
         </div>

         <div id="input-diskusi" className="bg-[#E0D4C6] p-6 rounded-[30px] border border-[#D1C4B4] shadow-sm transition-all relative z-10">
           {replyingTo && (
             <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl mb-4 border border-white/60">
               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                 Membalas @{replyingTo.user_name}
               </p>
               <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><X size={12}/></button>
             </div>
           )}
           <textarea
             value={newComment}
             onChange={(e) => setNewComment(e.target.value)}
             placeholder={user ? "Bagikan kesan atau tanyakan sesuatu..." : "Login untuk ikut berdiskusi"}
             disabled={!user}
             className="w-full bg-transparent outline-none text-sm h-24 resize-none p-2 font-medium text-gray-800 placeholder:text-gray-500"
           />
           <div className="flex justify-between items-center mt-4 border-t border-[#D1C4B4] pt-4">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">{user ? `@${user.user_metadata?.display_name || user.email?.split('@')[0]}` : "Tamu"}</p>
              <button onClick={handlePostComment} disabled={!newComment || !user || refreshing} className="bg-orange-500 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:bg-[#D1C4B4] transition-all shadow-md">
                {refreshing ? 'Mengirim...' : 'Kirim'}
              </button>
           </div>
         </div>

       </section>
     </div>
   </div>
 );
}