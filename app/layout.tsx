import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Lokkal — Marketplace Colombiano',
  description: 'Descubre y compra de marcas locales colombianas. Moda, belleza, arte y más.',
  openGraph: {
    title: 'Lokkal — Marketplace Colombiano',
    description: 'Marcas locales colombianas en un solo lugar',
    url: 'https://lokkal.co',
    siteName: 'Lokkal',
    locale: 'es_CO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
