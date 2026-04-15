import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Navbar from '../components/Navbar'
import { Suspense } from 'react' // 1. Tambahkan import ini

const jakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
})

export const viewport = {
  themeColor: '#F2EBE3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  title: 'Fiverecipe - Temukan Rahasia Dapur Autentik',
  description: 'Komunitas berbagi resep masakan rumahan terbaik. Temukan inspirasi, ciptakan keajaiban.',
  openGraph: {
    title: 'Fiverecipe',
    description: 'Komunitas berbagi resep masakan rumahan terbaik.',
    url: 'https://fiverecipe.com', 
    siteName: 'Fiverecipe',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${jakartaSans.className} bg-[#F2EBE3] text-gray-900 antialiased m-0 p-0 flex flex-col min-h-screen`}>
        
        {/* 2. BUNGKUS NAVBAR DENGAN SUSPENSE */}
        <Suspense fallback={<div className="h-20 bg-[#E0D4C6] animate-pulse w-full"></div>}>
          <Navbar />
        </Suspense>
        
        <main className="flex-grow w-full relative">
          {children}
        </main>

        <footer className="bg-[#E0D4C6] py-10 text-center text-gray-500 text-[10px] uppercase tracking-[0.5em] border-t border-[#D1C4B4] mt-auto relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div className="max-w-7xl mx-auto px-6">
            <p>&copy; Fiverecipe 2026</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
