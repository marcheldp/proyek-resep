"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // 1. OPTIMASI: Import Image Next.js
import { supabase } from '@/lib/supabase';
import { 
  Camera, Plus, Trash2, ArrowLeft, Eye, Send, X, 
  Zap, Utensils, Activity, Droplets, Leaf, Star, Share2, Loader2, Bookmark, Heart, MessageSquare
} from 'lucide-react';

export default function TambahResep() {
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(""); 
  
  const [formData, setFormData] = useState({
    title: '', about: '', image_url: '', 
    category: 'harian',
    calories: '', protein: '', carbs: '', fat: '', fiber: '',
    ingredients: ['', ''], 
    steps: [
      { text: '', imageFile: null, imagePreview: '' },
      { text: '', imageFile: null, imagePreview: '' }
    ]
  });

  useEffect(() => {
    let isMounted = true; // 2. OPTIMASI: Penjaga kebocoran memori

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

  // --- VALIDASI RASIO 16:9 (LANDSCAPE) ---
  const validateAspectRatio = (file) => {
    return new Promise((resolve) => {
      const img = new window.Image(); // 3. OPTIMASI: Gunakan window.Image agar tidak bentrok dengan next/image
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio >= 1.6 && ratio <= 1.9 && img.width > img.height) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
    });
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  // Handle Foto Utama
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const isValid = await validateAspectRatio(file);
      if (!isValid) {
        alert("Gagal! Foto Utama harus Landscape/Miring dengan rasio 16:9.");
        e.target.value = ""; 
        return;
      }

      // 4. OPTIMASI MEMORI: Hapus Blob lama foto utama
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleDynamic = (type, index, value) => {
    const newArr = [...formData[type]];
    if (type === 'steps') {
      newArr[index].text = value; 
    } else {
      newArr[index] = value;
    }
    setFormData({...formData, [type]: newArr});
  };

  // Handle Foto Langkah
  const handleStepFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const isValid = await validateAspectRatio(file);
      if (!isValid) {
        alert(`Langkah ${index + 1}: Foto ditolak! Wajib Landscape 16:9.`);
        e.target.value = ""; 
        return;
      }
      const newSteps = [...formData.steps];
      
      // 5. OPTIMASI MEMORI: Hapus Blob lama foto langkah
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
    
    // 6. OPTIMASI MEMORI: Jika langkah dihapus, hapus juga Blob URL dari RAM
    if (type === 'steps' && formData.steps[index].imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.steps[index].imagePreview);
    }

    const newArr = formData[type].filter((_, i) => i !== index);
    setFormData({...formData, [type]: newArr});
  };

  const handleCancel = () => {
    const hasChanges = formData.title !== '' || imageFile !== null;
    if (hasChanges) {
      if (window.confirm("⚠️ Yakin ingin membatalkan? Perubahan belum disimpan.")) {
        router.back();
      }
    } else {
      router.back(); 
    }
  };

  const uploadToStorage = async (file) => {
    if (!file) return "";
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resep-image') 
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('resep-image').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!formData.title || !imageFile) return alert("Judul dan Foto Utama wajib diisi ya!");
    if (!window.confirm("🚀 Siap menerbitkan resep ini?")) return;
    
    setUploading(true);
    try {
      const finalImageUrl = await uploadToStorage(imageFile);
      
      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        let stepUrl = null;
        if (step.imageFile) {
          stepUrl = await uploadToStorage(step.imageFile);
        }
        return {
          text: step.text,
          step_image_url: stepUrl
        };
      }));

      const cleanIngredients = formData.ingredients.filter(i => i.trim() !== "");
      const cleanSteps = processedSteps.filter(s => s.text.trim() !== "");

      const currentUsername = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'koki_handal';

      const { error } = await supabase.from('recipes').insert([{ 
        ...formData, 
        ingredients: cleanIngredients,
        steps: cleanSteps, 
        image_url: finalImageUrl,
        user_id: user.id,
        user_name: currentUsername
      }]);
      
      if (error) throw error;
      alert("✅ Berhasil! Resepmu sudah tayang.");
      router.push('/resep');
    } catch (error) {
      alert("Gagal posting: " + error.message);
    } finally {
      setUploading(false);
    }
  };

// --- TAMPILAN PRATINJAU (VERSI LENGKAP) ---
if (isPreview) {
  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 relative animate-in fade-in duration-500">
      
      <header className="bg-[#E0D4C6]/90 backdrop-blur-md px-6 py-4 border-b border-[#D1C4B4] flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setIsPreview(false)} className="p-3 bg-[#F2EBE3] border border-[#D1C4B4] rounded-2xl text-orange-500 active:scale-90 transition-all shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
           <h1 className="text-[10px] font-black text-orange-600 tracking-widest uppercase italic">Mode Pratinjau</h1>
        </div>
        <div className="w-12"></div> 
      </header>

      <div className="w-full aspect-video relative overflow-hidden bg-[#E0D4C6]">
        {imagePreview ? (
          <Image 
            src={imagePreview} 
            alt="Preview" 
            fill
            className="object-cover" 
            unoptimized={imagePreview.startsWith('blob:')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Foto Utama Belum Ada</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-12 left-6 right-6 z-10">
           <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-3 inline-block shadow-lg">
             Resep {formData.category}
           </span>
           <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
             {formData.title || "NAMA MASAKAN"}
           </h2>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        
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
            <button className="text-xl font-black text-pink-500 flex items-center gap-1 leading-none justify-center">
               <Heart size={16} fill="currentColor" /> 0
            </button>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2">Likes</p>
          </div>
        </div>

        <div className="mt-8">
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
                <p className="font-black text-gray-900 text-xs">{n.val || '0'}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-16 bg-[#E0D4C6]/40 -mx-6 px-10 py-16 text-center border-y border-[#D1C4B4]">
          <h2 className="text-2xl font-medium text-gray-800 mb-6 tracking-tight uppercase">Tentang Masakan</h2>
          <p className="text-gray-700 leading-relaxed text-sm md:text-base max-w-2xl mx-auto font-light break-words">
            {formData.about || "Belum ada deskripsi yang ditulis..."}
          </p>
        </section>

        <section className="mt-20 px-4 md:px-10">
          <h2 className="text-2xl font-medium text-gray-800 mb-10 text-center tracking-tight uppercase">Bahan-Bahan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.ingredients.map((ing, i) => (
              ing && (
                <div key={i} className="flex items-center gap-3 p-4 bg-white/40 rounded-2xl border border-white/60">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <p className="text-gray-700 text-sm font-light">{ing}</p>
                </div>
              )
            ))}
          </div>
        </section>

        <section className="mt-24 px-4 md:px-10 border-b border-[#D1C4B4] pb-12">
          <h2 className="text-2xl font-medium text-gray-800 mb-12 text-center tracking-tight uppercase">Cara Membuat</h2>
          <div className="space-y-16">
            {formData.steps.map((step, i) => (
              (step.text || step.imagePreview) && (
                <div key={i} className="flex flex-col gap-6">
                  <div className="flex gap-6">
                    <span className="text-xl font-black text-orange-500 shrink-0 italic">{i + 1}.</span>
                    <div className="flex-1 space-y-6">
                      
                      {step.imagePreview && (
                        <div className="w-full max-w-2xl aspect-video relative rounded-[35px] overflow-hidden border-4 border-white shadow-md">
                          <Image 
                            src={step.imagePreview} 
                            fill
                            className="object-cover" 
                            alt={`Langkah ${i+1}`}
                            unoptimized={step.imagePreview.startsWith('blob:')} 
                          />
                        </div>
                      )}

                      <p className="text-gray-700 text-sm md:text-base leading-relaxed font-light break-words">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-col gap-4">
          <button 
            onClick={handleSubmit} 
            disabled={uploading}
            className="w-full py-6 bg-orange-500 text-white font-black rounded-[40px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase text-xs disabled:bg-orange-400"
          >
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Terbitkan Sekarang</>}
          </button>
          <button 
            onClick={() => setIsPreview(false)} 
            className="w-full py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest"
          >
            Kembali ke Editor
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="bg-[#F2EBE3] min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between">
          <button onClick={handleCancel} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] text-gray-600 flex items-center justify-center shadow-sm border border-[#D1C4B4]">
             <X size={26} />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Dapur <span className="text-orange-500">Baru</span></h1>
          <button onClick={() => setIsPreview(true)} className="h-14 w-14 bg-[#E0D4C6] rounded-[22px] text-orange-500 flex items-center justify-center shadow-sm border border-[#D1C4B4]">
             <Eye size={26} />
          </button>
        </div>

        <div className="space-y-4">
           <label className="block w-full aspect-video bg-[#E0D4C6] rounded-[45px] border-4 border-dashed border-[#D1C4B4] flex flex-col items-center justify-center text-gray-500 cursor-pointer overflow-hidden relative shadow-inner">
              {imagePreview ? (
                <Image 
                  src={imagePreview} 
                  fill
                  className="object-cover" 
                  alt="Preview" 
                  unoptimized={imagePreview.startsWith('blob:')}
                />
              ) : (
                <>
                  <div className="bg-[#F2EBE3] p-6 rounded-3xl mb-3 text-orange-500 border border-[#D1C4B4]">
                    <Camera size={36} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Wajib Landscape 16:9</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
           </label>
           
           <input 
             name="title" 
             value={formData.title}
             onChange={handleChange} 
             placeholder="BERI NAMA MASAKAN..." 
             className="w-full p-7 bg-[#E0D4C6] rounded-[35px] font-black text-2xl outline-none focus:ring-2 focus:ring-orange-400 focus:bg-[#F2EBE3] transition-colors uppercase italic border border-[#D1C4B4] text-gray-800" 
           />

           <div className="flex gap-3">
             <button onClick={() => setFormData({...formData, category: 'harian'})} className={`flex-1 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest border-2 ${formData.category === 'harian' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[#E0D4C6] border-[#D1C4B4] text-gray-500'}`}>Harian</button>
             <button onClick={() => setFormData({...formData, category: 'sehat'})} className={`flex-1 py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest border-2 ${formData.category === 'sehat' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[#E0D4C6] border-[#D1C4B4] text-gray-500'}`}>Sehat</button>
           </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
           {['calories', 'protein', 'carbs', 'fat', 'fiber'].map((nut) => (
             <div key={nut} className="bg-[#E0D4C6] p-3 rounded-2xl border border-[#D1C4B4] text-center">
                <p className="text-[7px] font-black uppercase text-gray-500 mb-1">{nut}</p>
                <input name={nut} value={formData[nut]} onChange={handleChange} placeholder="0" className="w-full text-center font-black text-orange-500 outline-none bg-transparent" />
             </div>
           ))}
        </div>

        <textarea 
          name="about" 
          value={formData.about}
          onChange={handleChange} 
          placeholder="Ceritakan sejarah atau rasa masakan ini..." 
          className="w-full p-7 bg-[#E0D4C6] rounded-[35px] h-36 outline-none focus:ring-2 focus:ring-orange-400 focus:bg-[#F2EBE3] transition-colors font-medium text-sm text-gray-800 resize-none border border-[#D1C4B4]" 
        />
        
        <div className="space-y-4">
          <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500">Daftar Bahan</p>
          {formData.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-3">
              <input value={ing} onChange={(e) => handleDynamic('ingredients', i, e.target.value)} placeholder={`Bahan #${i+1}`} className="w-full p-5 bg-[#E0D4C6] rounded-2xl outline-none font-bold text-sm border border-[#D1C4B4]" />
              <button onClick={() => removeField('ingredients', i)} className="p-3 text-red-400 bg-[#E0D4C6] rounded-2xl border border-[#D1C4B4]"><Trash2 size={20}/></button>
            </div>
          ))}
          <button onClick={() => addField('ingredients')} className="w-full py-5 border-2 border-dashed border-orange-400 text-orange-600 rounded-[25px] font-black text-[10px] uppercase">+ Baris Bahan</button>
        </div>

        <div className="space-y-6">
          <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-500">Langkah Pembuatan</p>
          {formData.steps.map((step, i) => (
            <div key={i} className="bg-[#E0D4C6] p-6 rounded-[40px] border border-[#D1C4B4] space-y-4 shadow-sm animate-in slide-in-from-right-2">
               <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black italic shadow-md">{i+1}</div>
                  <div className="flex gap-2">
                    <label className="p-3 bg-[#F2EBE3] rounded-2xl border border-[#D1C4B4] text-orange-500 cursor-pointer hover:bg-white transition-all shadow-sm active:scale-90">
                       <Camera size={20} />
                       <input type="file" accept="image/*" onChange={(e) => handleStepFileChange(i, e)} className="hidden" />
                    </label>
                    <button onClick={() => removeField('steps', i)} className="p-3 text-red-400 bg-[#F2EBE3] rounded-2xl border border-[#D1C4B4] shadow-sm hover:bg-white active:scale-90 transition-all"><Trash2 size={20}/></button>
                  </div>
               </div>

               {step.imagePreview && (
                 <div className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-white shadow-md">
                    <Image 
                      src={step.imagePreview} 
                      fill
                      className="object-cover" 
                      alt={`Langkah ${i+1}`} 
                      unoptimized={step.imagePreview.startsWith('blob:')}
                    />
                    <button onClick={() => {
                        // 7. OPTIMASI MEMORI: Hapus Blob URL saat pengguna menghapus gambar dari preview langkah
                        if (formData.steps[i].imagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(formData.steps[i].imagePreview);
                        }
                        const newSteps = [...formData.steps];
                        newSteps[i].imageFile = null;
                        newSteps[i].imagePreview = '';
                        setFormData({...formData, steps: newSteps});
                    }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg active:scale-90 z-10">
                        <X size={14} />
                    </button>
                 </div>
               )}

               <textarea 
                 value={step.text} 
                 onChange={(e) => handleDynamic('steps', i, e.target.value)} 
                 placeholder={`Detail instruksi langkah ke-${i+1}...`} 
                 className="w-full p-5 bg-[#F2EBE3] rounded-3xl outline-none font-medium text-sm border border-[#D1C4B4] min-h-[100px] resize-none" 
               />
            </div>
          ))}
          <button onClick={() => addField('steps')} className="w-full py-5 border-2 border-dashed border-orange-400 text-orange-600 rounded-[25px] font-black text-[10px] uppercase tracking-widest">+ Baris Langkah</button>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={uploading}
          className="w-full py-6 bg-orange-500 text-white font-black rounded-[40px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-xs disabled:bg-orange-400"
        >
           {uploading ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Terbitkan Sekarang</>}
        </button>

      </div>
    </div>
  );
}