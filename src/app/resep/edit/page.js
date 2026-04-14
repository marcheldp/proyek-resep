"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Ambil id dari URL
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditResepPage() {
  const router = useRouter();
  const { id } = useParams(); // Mengambil ID resep dari URL (misal: /resep/edit/123)

  // --- STATE ---
  const [formData, setFormData] = useState({
    title: "",
    about: "",
    category: "harian",
    ingredients: [],
    steps: []
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // --- 1. LOGIKA LOAD DATA (WAJIB DI DALAM SINI) ---
  useEffect(() => {
    let isMounted = true;

    async function loadOldData() {
      if (!id) return;
      try {
        const { data } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single()
          .throwOnError();

        if (isMounted && data) {
          // Format steps agar kompatibel dengan UI form Chef
          const formattedSteps = data.steps.map(step => {
            if (typeof step === 'object' && step !== null) {
              return { 
                text: step.text || '', 
                imagePreview: step.step_image_url || '' 
              };
            }
            return { text: step, imagePreview: '' };
          });

          setFormData({ ...data, steps: formattedSteps });
        }
      } catch (error) {
        console.error("Gagal memuat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOldData();
    return () => { isMounted = false; };
  }, [id]);

  // --- 2. LOGIKA UPDATE (WAJIB DI DALAM SINI) ---
  const handleUpdate = async () => {
    if (!formData.title) return alert("Judul resep tidak boleh kosong, Chef!");
    if (!confirm("Simpan perubahan resep ini?")) return;

    setUpdating(true); 
    try {
      const cleanIngredients = formData.ingredients.filter(ing => ing.trim() !== "");
      const cleanSteps = formData.steps
        .filter(s => s.text.trim() !== "")
        .map(s => ({
           text: s.text,
           step_image_url: s.imagePreview 
        }));

      await supabase
        .from('recipes')
        .update({ 
          title: formData.title, 
          about: formData.about,
          category: formData.category,
          ingredients: cleanIngredients,
          steps: cleanSteps
        })
        .eq('id', id)
        .throwOnError();

      alert("Update Berhasil! 🎉");
      router.push('/profil');
      
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  );

  return (
    <div className="p-6 bg-[#F2EBE3] min-h-screen">
      {/* UI FORM CHEF DI SINI */}
      <button onClick={handleUpdate} disabled={updating}>
        {updating ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}
