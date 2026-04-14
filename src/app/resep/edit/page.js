useEffect(() => {
  let isMounted = true; // 1. Penjaga Memory Leak

  async function loadOldData() {
    try {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()
        .throwOnError(); // 2. Tangkap error jika internet putus

      if (isMounted && data) {
        // 3. FORMATTING AMAN: Samakan format database dengan format UI
        const formattedSteps = data.steps.map(step => {
          if (typeof step === 'object' && step !== null) {
            return { text: step.text || '', imageFile: null, imagePreview: step.step_image_url || '' };
          }
          // Jika format lama hanya berupa teks
          return { text: step, imageFile: null, imagePreview: '' };
        });

        // Gabungkan data aman ke dalam form
        setFormData({ ...data, steps: formattedSteps });
      }
    } catch (error) {
      console.error("Gagal memuat:", error);
      if (isMounted) alert("Gagal memuat resep lama.");
    }
  }

  loadOldData();

  return () => { isMounted = false; }; // Cleanup saat keluar halaman
}, [id]);

const handleUpdate = async () => {
  // 1. Validasi UX Dasar
  if (!formData.title) return alert("Judul resep tidak boleh kosong, Chef!");
  if (!confirm("Simpan perubahan resep ini?")) return;

  setLoading(true); 
  
  try {
    // 2. BERSIHKAN DATA KOSONG (Filter)
    // Jangan biarkan kolom bahan yang kosong ikut tersimpan
    const cleanIngredients = formData.ingredients.filter(ing => ing.trim() !== "");
    
    // 3. FORMAT ULANG STEPS
    // Buang 'imageFile' dan 'imagePreview' karena database tidak mengerti format itu.
    // Database hanya butuh teks dan URL gambar matang.
    const cleanSteps = formData.steps
      .filter(s => s.text.trim() !== "")
      .map(s => ({
         text: s.text,
         step_image_url: s.imagePreview // Asumsi gambar sudah di-upload sebelumnya
      }));

    // 4. Update ke Database
    await supabase
      .from('recipes')
      .update({ 
        title: formData.title, 
        about: formData.about,
        category: formData.category,
        ingredients: cleanIngredients,
        steps: cleanSteps
        // image_url ditangani terpisah sesuai kode kita sebelumnya
      })
      .eq('id', id)
      .throwOnError(); // Penting agar masuk ke catch jika gagal

    alert("Update Berhasil! 🎉");
    router.push('/profil');
    
  } catch (error) {
    console.error("Gagal update:", error);
    alert("Waduh, gagal menyimpan: " + error.message);
  } finally {
    setLoading(false);
  }
};
