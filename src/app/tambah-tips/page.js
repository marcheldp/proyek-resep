"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { supabase } from '@/lib/supabase';
import { 
  Camera, ArrowLeft, Eye, Send, X, Loader2, Bookmark, Heart, MessageSquare, Clock
} from 'lucide-react';

export default function TambahTips() {
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(""); 
  
  const [formData, setFormData] = useState({
    title: '', content: ''
  });

  const contentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!session) {
        alert("Waduh, login dulu ya Chef!");
        router.push('/profil');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [router]);

  // Helper untuk Preview
  const getReadTime = (content) => {
    if (!content) return "1 Menit";
    const wordsPerMinute = 200; 
    const numberOfWords = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(numberOfWords / wordsPerMinute);
    return `${minutes} Menit Baca`;
  };

  const handleTitleChange = (e) => setFormData({...formData, title: e.target.value});

  const handleContentChange = (e) => {
    setFormData({...formData, content: e.target.value});
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return "";
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `tips_${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('resep-image').upload(filePath, imageFile);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('resep-image').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !imageFile) return alert("Foto, Judul, dan Isi Tips wajib diisi ya!");
    if (!window.confirm("🚀 Siap untuk membagikan tips ini?")) return;
    
    setUploading(true);
    try {
      const finalImageUrl = await uploadImage();
      const currentUsername = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'pakar_dapur';
      const { error } = await supabase.from('tips').insert([{ 
        title: formData.title,
        content: formData.content, 
        image_url: finalImageUrl,
        user_id: user.id,
        user_name: currentUsername 
      }]);
      if (error) throw error;
      alert("✅ Berhasil! Tips dapurmu sudah tayang.");
      router.push('/profil'); 
    } catch (error) {
      alert("Gagal posting: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const displayAuthor = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'pakar_dapur';

  // --- TAMPILAN PREVIEW (SAMA DENGAN DETAIL TIPS) ---
  if (isPreview) {
    return (
      <div className="bg-[#F2EBE3] min-h-screen">
        {/* HERO SECTION - TINGGI 50VH */}
        <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
          <button 
            onClick={() => setIsPreview(false)} 
            className="absolute top-6 left-6 z-30 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white hover:text-black transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>

          {imagePreview ? (
            <Image 
              src={imagePreview} 
              alt="Preview" 
              fill
              className="object-cover" 
              unoptimized={imagePreview.startsWith('blob:')}
            />
          ) : (
            <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white">Foto Belum Ada</div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end z-10">
            <div className="max-w-4xl mx-auto w-full px-6 pb-12">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 inline-block shadow-lg">
                Knowledge Preview
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter uppercase italic [text-shadow:2px_2px_10px_rgba(0,0,0,0.5)]">
                {formData.title || "JUDUL TIPS"}
              </h1>
            </div>
          </div>
        </div>

        {/* BODY SECTION */}
        <div className="max-w-3xl mx-auto px-6 py-12 relative z-20">
          {/* USERNAME TENGAH */}
          <div className="flex flex-col items-center mb-10">
             <div className="flex items-center gap-3 px-6 py-2.5 bg-[#E0D4C6] border border-[#D1C4B4] rounded-full shadow-sm">
                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-black uppercase">
                  {displayAuthor[0]}
                </div>
                <p className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em] italic">
                  Ditulis Oleh @{displayAuthor}
                </p>
             </div>
          </div>

          {/* Stats Bar Mockup */}
          <div className="flex items-center justify-between border-b border-[#D1C4B4]/50 pb-8 mb-12">
            <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Clock size={14} className="text-orange-500"/> {getReadTime(formData.content)}</span>
              <span className="flex items-center gap-2"><Eye size={14} className="text-blue-500"/> 0 View</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              Pratinjau Hari Ini
            </p>
          </div>

          {/* ISI KONTEN */}
          <article className="prose prose-orange max-w-none">
            <div className="text-gray-800 leading-[2.1] text-lg md:text-xl font-light whitespace-pre-wrap text-left italic opacity-90 break-words">
              {formData.content || "Tulis isi tips Anda di editor..."}
            </div>
          </article>

          {/* Tombol Aksi di Bawah Preview */}
          <div className="mt-20 pt-10 border-t border-[#D1C4B4] flex flex-col gap-4">
             <button 
                onClick={handleSubmit} 
                disabled={uploading}
                className="w-full py-6 bg-blue-600 text-white font-black rounded-[35px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-xs"
              >
                {uploading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Terbitkan Sekarang</>}
              </button>
              <button onClick={() => setIsPreview(false)} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] hover:text-orange-500 transition-colors">
                Kembali Edit
              </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN EDIT/FORM ---
  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] text-gray-600 flex items-center justify-center shadow-sm border border-[#D1C4B4]">
             <X size={26} />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Tips <span className="text-blue-500">Baru</span></h1>
          <button onClick={() => setIsPreview(true)} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] text-blue-500 flex items-center justify-center shadow-sm border border-[#D1C4B4]">
             <Eye size={26} />
          </button>
        </div>

        <div className="space-y-4">
           <label className="block w-full h-64 bg-[#E0D4C6] rounded-[45px] border-4 border-dashed border-[#D1C4B4] flex flex-col items-center justify-center text-gray-500 cursor-pointer overflow-hidden relative shadow-inner group">
              {imagePreview ? (
                <Image src={imagePreview} fill className="object-cover" alt="Preview" unoptimized={imagePreview.startsWith('blob:')} />
              ) : (
                <div className="text-center">
                  <Camera size={36} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Upload Foto Cover</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
           </label>
           
           <input 
             value={formData.title}
             onChange={handleTitleChange} 
             placeholder="JUDUL TIPS..." 
             className="w-full p-7 bg-[#E0D4C6] rounded-[35px] shadow-inner font-black text-2xl outline-none focus:ring-2 focus:ring-blue-400 uppercase italic border border-[#D1C4B4] text-gray-800" 
           />
        </div>

        <div className="space-y-2">
           <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500 pl-2">Isi Artikel Tips</p>
           <textarea 
             ref={contentRef}
             value={formData.content}
             onChange={handleContentChange} 
             placeholder="Tuliskan rahasia dapur Anda..." 
             className="w-full p-7 bg-[#E0D4C6] rounded-[35px] shadow-inner min-h-[300px] outline-none focus:ring-2 focus:ring-blue-400 font-medium text-base text-gray-800 border border-[#D1C4B4] resize-none overflow-hidden" 
           />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={uploading}
          className="w-full py-6 bg-blue-600 text-white font-black rounded-[40px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase text-xs"
        >
           {uploading ? <Loader2 className="animate-spin" /> : "Terbitkan Tips"}
        </button>
      </div>
    </div>
  );
}
