import type { Metadata, Viewport } from 'next'
import { Inter, Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'
import MotionProvider from '@/components/providers/MotionProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  // Only load the weights actually used — avoids downloading unused font variations
  weight: ['400', '500', '600', '700'],
  preload: true,
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  preload: true,
})

export const metadata: Metadata = {
  title: 'IILM Connect',
  description: 'IILM University Campus App',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${hanken.variable} dark`}>
      <body className="bg-transparent text-on-surface antialiased font-body">
        <MotionProvider>
          {children}
        </MotionProvider>
        <ToastProvider />
      </body>
    </html>
  )
}
