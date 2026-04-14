"use client";

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // 1. OPTIMASI: Import Image
import { supabase } from '@/lib/supabase';
import { 
  Camera, ArrowLeft, Eye, Send, X, Loader2, BookOpen
} from 'lucide-react';

export default function EditTips({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  // (Fitur isPreview bisa ditambahkan nanti jika Anda ingin, untuk sekarang kita hapus karena tidak dipakai di return)
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(""); 
  
  const [formData, setFormData] = useState({
    title: '', content: '', image_url: ''
  });

  const contentRef = useRef(null);

  useEffect(() => {
    let isMounted = true; // 2. OPTIMASI: Penjaga Memory Leak

    async function loadOldData() {
      if (isMounted) setLoading(true);
      
      try {
        // Cek sesi login terlebih dahulu
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (!session) {
          alert("Sesi berakhir, silakan login kembali.");
          router.push('/profil');
          return;
        }

        // 3. OPTIMASI: Gunakan throwOnError
        const { data } = await supabase
          .from('tips')
          .select('*')
          .eq('id', id)
          .single()
          .throwOnError();

        if (isMounted && data) {
          setFormData(data);
          setImagePreview(data.image_url || "");
        }
      } catch (error) {
        console.error("Gagal memuat tips:", error);
        if (isMounted) {
          alert("Tips tidak ditemukan atau terjadi kesalahan!");
          router.push('/profil');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOldData();

    return () => { isMounted = false; };
  }, [id, router]);

  // Otomatis sesuaikan tinggi textarea saat data dimuat
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
    }
  }, [formData.content]);

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
      // 4. OPTIMASI MEMORI: Hapus URL blob lama sebelum membuat yang baru
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url; 
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `tips_${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resep-image') 
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('resep-image').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleUpdate = async () => {
    if (!formData.title || !formData.content) return alert("Judul dan Isi Tips wajib diisi!");
    if (!confirm("💾 Simpan perubahan tips ini?")) return;

    setUploading(true);
    try {
      const finalImageUrl = await uploadImage();
      
      const { error } = await supabase
        .from('tips')
        .update({ 
          title: formData.title,
          content: formData.content,
          image_url: finalImageUrl
        })
        .eq('id', id);
      
      if (error) throw error;
      alert("✅ Tips berhasil diperbarui!");
      router.push('/profil');
    } catch (error) {
      alert("Gagal update: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
      <p className="font-black text-xs uppercase tracking-widest text-gray-500">Memuat Tips...</p>
    </div>
  );

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Navigasi Atas */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] text-gray-600 flex items-center justify-center border border-[#D1C4B4] active:scale-90 transition-transform">
             <X size={26} />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Edit <span className="text-blue-500">Tips</span></h1>
          <div className="w-14"></div> {/* Spacer */}
        </div>

        {/* Upload Foto Cover */}
        <div className="space-y-4">
           <label className="block w-full h-64 bg-[#E0D4C6] rounded-[45px] border-4 border-dashed border-[#D1C4B4] flex flex-col items-center justify-center overflow-hidden relative shadow-inner group cursor-pointer">
              {/* OPTIMASI GAMBAR NEXT.JS */}
              {imagePreview && (
                <Image 
                  src={imagePreview} 
                  fill 
                  className="object-cover" 
                  alt="Preview" 
                  unoptimized={imagePreview.startsWith('blob:')}
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <Camera size={40} className="text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
           </label>
           
           {/* Input Judul */}
           <input 
             value={formData.title}
             onChange={(e) => setFormData({...formData, title: e.target.value})} 
             placeholder="JUDUL TIPS..." 
             className="w-full p-7 bg-[#E0D4C6] rounded-[35px] shadow-inner font-black text-2xl outline-none focus:ring-2 focus:ring-blue-400 uppercase italic tracking-tighter border border-[#D1C4B4] text-gray-800" 
           />
        </div>

        {/* Area Isi Tips (Auto Expand) */}
        <div className="space-y-2">
           <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500 pl-2">Isi Artikel Tips</p>
           <textarea 
             ref={contentRef}
             value={formData.content}
             onChange={handleContentChange} 
             placeholder="Tuliskan perubahan tips menarikmu di sini..." 
             className="w-full p-7 bg-[#E0D4C6] rounded-[35px] shadow-inner min-h-[300px] outline-none focus:ring-2 focus:ring-blue-400 transition-colors font-medium text-base text-gray-800 border border-[#D1C4B4] overflow-hidden resize-none" 
           />
        </div>

        <button 
          onClick={handleUpdate} 
          disabled={uploading}
          className="w-full py-6 bg-blue-600 text-white font-black rounded-[40px] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs disabled:bg-blue-400"
        >
           {uploading ? <Loader2 size={24} className="animate-spin" /> : "Simpan Perubahan Tips"}
        </button>

      </div>
    </div>
  );
}
