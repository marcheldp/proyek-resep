import { redirect } from 'next/navigation';

export default function EditTipsRoot() {
  // Melempar user secara instan dari sisi server sebelum halaman sempat dimuat
  redirect('/profil');
}
