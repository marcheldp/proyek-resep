// Di dalam useEffect halaman Edit
useEffect(() => {
  async function loadOldData() {
    const { data } = await supabase.from('recipes').select('*').eq('id', id).single();
    if (data) setFormData(data); // Mengisi formulir otomatis dengan data lama
  }
  loadOldData();
}, [id]);

// Fungsi Simpan Perubahan
const handleUpdate = async () => {
  setLoading(true);
  const { error } = await supabase
    .from('recipes')
    .update({ 
      title: formData.title, 
      about: formData.about,
      ingredients: formData.ingredients,
      steps: formData.steps,
      category: formData.category
      // image_url hanya diupdate jika user upload foto baru
    })
    .eq('id', id);

  if (!error) {
    alert("Update Berhasil!");
    router.push('/profil');
  }
};
