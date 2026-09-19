import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import 'goey-toast/styles.css'
import { ToastWrapper } from '@/components/wrapper/toast'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Chess Engine',
  description: 'A simple JS-based chess engine',
  manifest: '/manifest.json',
  themeColor: '#176E55',
}
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='flex min-h-full flex-col'>
        <ToastWrapper>{children}</ToastWrapper>
      </body>
    </html>
  )
}
