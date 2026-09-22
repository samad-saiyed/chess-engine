import { Geist_Mono, Inter } from 'next/font/google'

import { ToastWrapper } from '@/components/wrapper/toast'
import 'goey-toast/styles.css'
import 'blobatar/motion.css'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  preload: true,
  fallback: [
    'system-ui',
    'Geist',
    'Geist_Mono',
    'ui-sans-serif',
    'system-ui',
    'Helvetica Neue',
    'Arial',
    'Noto Sans',
    'sans-serif',
  ],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chess Engine',
  description: 'A simple JS-based chess engine',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Chess Engine',
    description: 'A simple JS-based chess engine',
    images: '/og.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chess Engine',
    description: 'A simple JS-based chess engine',
    images: '/og.png',
  },
}
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='flex min-h-full flex-col'>
        <ToastWrapper>{children}</ToastWrapper>
      </body>
    </html>
  )
}
