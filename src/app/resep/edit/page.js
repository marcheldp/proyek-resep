"use client"; // WAJIB ADA

import { useState, useEffect, use } from 'react'; // 1. INI YANG KURANG (Penyebab Error)
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Send, X } from 'lucide-react';

export default function EditResep({ params }) {
  // 2. Resolved params untuk mengambil ID
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', about: '', ingredients: [''], steps: [], category: 'harian'
  });

  // --- LOGIKA YANG ANDA KIRIM TADI (DI MASUKKAN KE SINI) ---
  useEffect(() => {
    let isMounted = true;

    async function loadOldData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single();

        if (isMounted && data) {
          setFormData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOldData();

    return () => { isMounted = false; };
  }, [id]);

  const handleUpdate = async () => {
    if (!formData.title) return alert("Judul wajib diisi!");
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ 
          title: formData.title, 
          about: formData.about,
          ingredients: formData.ingredients,
          steps: formData.steps,
          category: formData.category
        })
        .eq('id', id);

      if (error) throw error;
      
      alert("✅ Update Berhasil!");
      router.push('/profil');
    } catch (error) {
      alert("Gagal update: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Tampilan Loading saat build/load data
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  );

  return (
    <div className="bg-[#F2EBE3] min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-black uppercase italic">Edit Resep</h1>
        
        {/* Contoh Input Sederhana */}
        <input 
          className="w-full p-4 rounded-2xl border"
          value={formData.title} 
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Judul Resep"
        />

        <textarea 
          className="w-full p-4 rounded-2xl border h-32"
          value={formData.about}
          onChange={(e) => setFormData({...formData, about: e.target.value})}
          placeholder="Tentang Resep"
        />

        <button 
          onClick={handleUpdate}
          disabled={uploading}
          className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <><Send size={20}/> Simpan Perubahan</>}
        </button>
      </div>
    </div>
  );
}
