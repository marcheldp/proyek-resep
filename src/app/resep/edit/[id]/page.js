"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; 
import { supabase } from '@/lib/supabase';
import { 
  Camera, Trash2, Eye, Send, X, 
  Zap, Utensils, Activity, Droplets, Leaf, Loader2, ArrowLeft, Star, Heart
} from 'lucide-react';

export default function EditResep({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  // State Foto Utama
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(""); 
  
  const [formData, setFormData] = useState({
    title: '', about: '', image_url: '', 
    category: 'harian',
    calories: '', protein: '', carbs: '', fat: '', fiber: '',
    ingredients: [''], 
    steps: [{ text: '', imageFile: null, imagePreview: '' }]
  });

  useEffect(() => {
    let isMounted = true; 

    async function checkUserAndLoadData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;
      
      if (!session) {
        router.push('/profil');
        return;
      }
      setUser(session.user);

      try {
        const { data } = await supabase.from('recipes').select('*').eq('id', id).single().throwOnError();

        if (!isMounted) return;

        if (data) {
          const formattedSteps = data.steps.map(step => {
            if (typeof step === 'object' && step !== null) {
              return { text: step.text || '', imageFile: null, imagePreview: step.step_image_url || '' };
            }
            return { text: step, imageFile: null, imagePreview: '' };
          });

          setFormData({ ...data, steps: formattedSteps });
          setImagePreview(data.image_url || '');
        }
      } catch (error) {
        console.error("Gagal memuat resep:", error);
        alert("Resep tidak ditemukan atau terjadi kesalahan!");
        if (isMounted) router.push('/profil');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkUserAndLoadData();

    return () => { isMounted = false; };
  }, [id, router]);

  const validateAspectRatio = (file) => {
    return new Promise((resolve) => {
      const img = new globalThis.Image(); // Gunakan global window.Image untuk helper
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio >= 1.6 && ratio <= 1.9 && img.width > img.height) { resolve(true); } 
        else { resolve(false); }
      };
    });
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isValid = await validateAspectRatio(file);
      if (!isValid) {
        alert("Gagal! Foto Utama harus Landscape/Miring (16:9).");
        return;
      }
      
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleDynamic = (type, index, value) => {
    const newArr = [...formData[type]];
    if (type === 'steps') { newArr[index].text = value; } 
    else { newArr[index] = value; }
    setFormData({...formData, [type]: newArr});
  };

  const handleStepFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const isValid = await validateAspectRatio(file);
      if (!isValid) {
        alert(`Langkah ${index + 1}: Wajib Landscape 16:9.`);
        return;
      }
      
      const newSteps = [...formData.steps];
      if (newSteps[index].imagePreview && newSteps[index].imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newSteps[index].imagePreview);
      }
      
      newSteps[index].imageFile = file;
      newSteps[index].imagePreview = URL.createObjectURL(file);
      setFormData({...formData, steps: newSteps});
    }
  };

  const addField = (type) => {
    const newItem = type === 'steps' ? { text: '', imageFile: null, imagePreview: '' } : '';
    setFormData({...formData, [type]: [...formData[type], newItem]});
  };

  const removeField = (type, index) => {
    if (formData[type].length <= 1) return;
    const newArr = formData[type].filter((_, i) => i !== index);
    setFormData({...formData, [type]: newArr});
  };

  const uploadToStorage = async (file) => {
    if (!file) return null;
    const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('resep-image').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('resep-image').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleUpdate = async () => {
    if (!formData.title) return alert("Judul wajib diisi!");
    if (!confirm("💾 Simpan perubahan resep ini?")) return;

    setUploading(true);
    try {
      const finalMainImageUrl = imageFile ? await uploadToStorage(imageFile) : formData.image_url;
      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        let finalStepImageUrl = step.imagePreview; 
        if (step.imageFile) { finalStepImageUrl = await uploadToStorage(step.imageFile); }
        return { text: step.text, step_image_url: finalStepImageUrl };
      }));

      // Bersihkan array dari isian kosong sebelum disimpan ke database
      const cleanIngredients = formData.ingredients.filter(i => i.trim() !== "");
      const cleanSteps = processedSteps.filter(s => s.text.trim() !== "");

      await supabase.from('recipes').update({ 
        title: formData.title, 
        about: formData.about, 
        category: formData.category,
        calories: formData.calories, 
        protein: formData.protein, 
        carbs: formData.carbs,
        fat: formData.fat, 
        fiber: formData.fiber,
        ingredients: cleanIngredients,
        steps: cleanSteps,
        image_url: finalMainImageUrl 
      }).eq('id', id).throwOnError(); // Tambahkan throwOnError
      
      alert("✅ Berhasil diperbarui!");
      router.push('/profil');
    } catch (error) {
      alert("Gagal update: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const displayAuthor = formData?.user_name || 'koki_handal';

  // --- 1. TAMPILAN PRATINJAU (PREVIEW MODE) ---
  if (isPreview) {
    return (
      <div className="bg-[#F2EBE3] min-h-screen pb-24 relative animate-in fade-in duration-500">
        
        {/* Header Preview */}
        <header className="bg-[#E0D4C6] px-6 py-4 border-b border-[#D1C4B4] flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => setIsPreview(false)} className="p-3 bg-[#F2EBE3] border border-[#D1C4B4] rounded-2xl text-orange-500 active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-[10px] font-black text-gray-900 tracking-widest uppercase italic">Edit Pratinjau</h1>
            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-tighter italic">Mode Tampilan Resep</p>
          </div>
          <div className="w-12"></div>
        </header>

        {/* Hero Image */}
        <div className="w-full aspect-video relative overflow-hidden bg-[#E0D4C6]">
          <Image 
            src={imagePreview || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1200'} 
            alt="Preview" 
            fill
            className="object-cover" 
            unoptimized={imagePreview?.startsWith('blob:')} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-12 left-6 right-6">
             <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-3 inline-block shadow-lg">Recipe</span>
             <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{formData.title || "Nama Masakan"}</h2>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
          {/* Stats Card Mockup */}
          <div className="bg-[#E0D4C6] rounded-[40px] shadow-xl p-8 flex items-center justify-around border border-[#D1C4B4]">
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 leading-none">0</p>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Views</p>
            </div>
            <div className="h-8 w-px bg-[#D1C4B4]"></div>
            <div className="text-center">
              <p className="text-xl font-black text-orange-500 flex items-center gap-1 leading-none justify-center">
                <Star size={16} fill="currentColor" /> 5.0
              </p>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Rating</p>
            </div>
            <div className="h-8 w-px bg-[#D1C4B4]"></div>
            <div className="text-center">
              <p className="text-xl font-black text-pink-500 flex items-center gap-1 leading-none justify-center">
                 <Heart size={16} fill="currentColor" /> 0
              </p>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Likes</p>
            </div>
          </div>

          {/* Nutrisi */}
          <div className="mt-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.4em] mb-4 text-center italic">Informasi Nutrisi</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Kalori', val: formData.calories, icon: <Zap size={14} /> },
                { label: 'Protein', val: formData.protein, icon: <Utensils size={14} /> },
                { label: 'Karbo', val: formData.carbs, icon: <Activity size={14} /> },
                { label: 'Lemak', val: formData.fat, icon: <Droplets size={14} /> },
                { label: 'Serat', val: formData.fiber, icon: <Leaf size={14} /> }
              ].map((n, i) => (
                <div key={i} className="bg-[#E0D4C6]/60 rounded-3xl p-4 text-center border border-[#D1C4B4]">
                  <div className="flex justify-center mb-2 text-orange-500">{n.icon}</div>
                  <p className="text-[7px] font-black text-gray-500 uppercase mb-1">{n.label}</p>
                  <p className="font-black text-gray-900 text-xs">{n.val || '0g'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Author Center */}
          <div className="mt-12 flex flex-col items-center">
             <div className="flex items-center gap-2 px-6 py-2 bg-[#E0D4C6] border border-[#D1C4B4] rounded-full shadow-sm">
                <div className="h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-[10px] uppercase">
                  {displayAuthor[0]}
                </div>
                <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest italic">
                  Resep Oleh @{displayAuthor}
                </p>
             </div>
          </div>

          {/* Tentang */}
          <section className="mt-6 bg-[#E0D4C6]/40 -mx-6 px-10 py-16 text-center border-y border-[#D1C4B4]">
            <h2 className="text-2xl font-medium text-gray-800 mb-6 tracking-tight uppercase">Tentang Masakan</h2>
            <p className="text-gray-700 leading-relaxed text-sm md:text-base max-w-2xl mx-auto text-left font-light italic break-words">
              {formData.about || "Belum ada deskripsi..."}
            </p>
          </section>

          {/* PERBAIKAN: SEKSI BAHAN-BAHAN DITAMBAHKAN DI SINI! */}
          <section className="mt-20 px-4 md:px-10">
            <h2 className="text-2xl font-medium text-gray-800 mb-10 text-center tracking-tight uppercase">Bahan-Bahan</h2>
            <div className="space-y-4">
              {formData.ingredients?.filter(ing => ing.trim() !== "").length > 0 ? (
                formData.ingredients.map((ing, i) => (
                  ing.trim() !== "" && (
                    <p key={i} className="text-gray-700 text-sm md:text-base font-light leading-relaxed border-b border-[#D1C4B4]/30 pb-2 italic break-words">• {ing}</p>
                  )
                ))
              ) : (
                <p className="text-gray-400 text-center italic">Bahan belum ditambahkan...</p>
              )}
            </div>
          </section>

          {/* Langkah Langkah */}
          <section className="mt-24 px-4 md:px-10 pb-12">
            <h2 className="text-2xl font-medium text-gray-800 mb-12 text-center tracking-tight uppercase">Cara Membuat</h2>
            <div className="space-y-12">
              {formData.steps.map((step, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="flex gap-6">
                    <span className="text-lg font-bold text-orange-500 shrink-0">{i + 1}.</span>
                    <div className="flex-1 space-y-4">
                      {step.imagePreview && (
                        <div className="w-full max-w-lg aspect-video relative rounded-[30px] overflow-hidden border-4 border-white shadow-md">
                          <Image 
                            src={step.imagePreview} 
                            fill 
                            className="object-cover" 
                            alt={`Langkah ${i+1}`}
                            unoptimized={step.imagePreview?.startsWith('blob:')}
                          />
                        </div>
                      )}
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed font-light break-words">{step.text || "Langkah belum ditulis..."}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button onClick={() => setIsPreview(false)} className="w-full py-6 bg-orange-500 text-white font-black rounded-[40px] shadow-2xl uppercase text-xs tracking-widest mt-10">Kembali Edit</button>
        </div>
      </div>
    );
  }

  // --- 2. TAMPILAN MODE EDIT (FORM) ---
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F2EBE3]">
      <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
      <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500 italic">Memuat Resep...</p>
    </div>
  );

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] flex items-center justify-center border border-[#D1C4B4] active:scale-90 transition-all">
             <X size={26} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Edit <span className="text-orange-500">Resep</span></h1>
          <button onClick={() => setIsPreview(true)} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] flex items-center justify-center border border-[#D1C4B4] active:scale-90 transition-all">
             <Eye size={26} className="text-orange-500" />
          </button>
        </div>

        {/* Form Foto Utama 16:9 */}
        <div className="space-y-4">
           <label className="block w-full aspect-video bg-[#E0D4C6] rounded-[45px] border-4 border-dashed border-[#D1C4B4] flex flex-col items-center justify-center overflow-hidden relative shadow-inner cursor-pointer">
              {imagePreview && (
                <Image 
                  src={imagePreview} 
                  fill 
                  className="object-cover" 
                  alt="Preview" 
                  unoptimized={imagePreview.startsWith('blob:')}
                />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                 <Camera size={40} className="text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
           </label>
           <input name="title" value={formData.title} onChange={handleChange} placeholder="NAMA MASAKAN..." className="w-full p-7 bg-[#E0D4C6] rounded-[35px] font-black text-2xl outline-none uppercase italic border border-[#D1C4B4] text-gray-800" />
        </div>

        {/* Nutrisi Inputs */}
        <div className="grid grid-cols-5 gap-2">
           {['calories', 'protein', 'carbs', 'fat', 'fiber'].map((nut) => (
             <div key={nut} className="bg-[#E0D4C6] p-3 rounded-2xl border border-[#D1C4B4] text-center">
                <p className="text-[7px] font-black uppercase text-gray-500 mb-1">{nut}</p>
                <input name={nut} value={formData[nut]} onChange={handleChange} className="w-full text-center font-black text-orange-500 outline-none bg-transparent" />
             </div>
           ))}
        </div>

        <textarea name="about" value={formData.about} onChange={handleChange} placeholder="Tentang masakan..." className="w-full p-7 bg-[#E0D4C6] rounded-[35px] h-36 outline-none focus:ring-2 focus:ring-orange-400 font-medium text-sm text-gray-800 resize-none border border-[#D1C4B4]" />
        
        {/* Daftar Bahan */}
        <div className="space-y-4">
          <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500">Daftar Bahan</p>
          {formData.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-3">
              <input value={ing} onChange={(e) => handleDynamic('ingredients', i, e.target.value)} className="w-full p-5 bg-[#E0D4C6] rounded-2xl font-bold text-sm border border-[#D1C4B4]" />
              <button onClick={() => removeField('ingredients', i)} className="p-3 text-red-400 bg-[#E0D4C6] rounded-2xl border border-[#D1C4B4]"><Trash2 size={20}/></button>
            </div>
          ))}
          <button onClick={() => addField('ingredients')} className="w-full py-5 border-2 border-dashed border-orange-400 text-orange-600 rounded-[25px] font-black text-[10px] uppercase">+ Tambah Bahan</button>
        </div>

        {/* Langkah Pembuatan dengan Foto */}
        <div className="space-y-6">
          <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500">Langkah Pembuatan</p>
          {formData.steps.map((step, i) => (
            <div key={i} className="bg-[#E0D4C6] p-6 rounded-[40px] border border-[#D1C4B4] space-y-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black italic shadow-md">{i+1}</div>
                  <div className="flex gap-2">
                    <label className="p-3 bg-[#F2EBE3] rounded-2xl border border-[#D1C4B4] text-orange-500 cursor-pointer hover:bg-white transition-all shadow-sm">
                       <Camera size={20} />
                       <input type="file" accept="image/*" onChange={(e) => handleStepFileChange(i, e)} className="hidden" />
                    </label>
                    <button onClick={() => removeField('steps', i)} className="p-3 text-red-400 bg-[#F2EBE3] rounded-2xl border border-[#D1C4B4] shadow-sm"><Trash2 size={20}/></button>
                  </div>
               </div>
               {step.imagePreview && (
                 <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-white shadow-md">
                    <Image 
                      src={step.imagePreview} 
                      fill 
                      className="object-cover" 
                      alt="Step Preview" 
                      unoptimized={step.imagePreview.startsWith('blob:')}
                    />
                    <button onClick={() => {
                        if (formData.steps[i].imagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(formData.steps[i].imagePreview);
                        }
                        const newSteps = [...formData.steps];
                        newSteps[i].imageFile = null;
                        newSteps[i].imagePreview = '';
                        setFormData({...formData, steps: newSteps});
                    }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg z-10"><X size={14} /></button>
                 </div>
               )}
               <textarea value={step.text} onChange={(e) => handleDynamic('steps', i, e.target.value)} className="w-full p-5 bg-[#F2EBE3] rounded-3xl outline-none font-medium text-sm border border-[#D1C4B4] min-h-[100px] break-words resize-none" />
            </div>
          ))}
          <button onClick={() => addField('steps')} className="w-full py-5 border-2 border-dashed border-orange-400 text-orange-600 rounded-[25px] font-black text-[10px] uppercase">+ Tambah Langkah</button>
        </div>

        {/* Update Button */}
        <button onClick={handleUpdate} disabled={uploading} className="w-full py-6 bg-orange-500 text-white font-black rounded-[40px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase text-xs">
           {uploading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Simpan Perubahan</>}
        </button>

      </div>
    </div>
  );
}