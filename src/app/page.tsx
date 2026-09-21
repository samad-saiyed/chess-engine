import { ChessBoard } from '@/components/chess/ChessBoard'
import { StatScreen } from '@/components/stats/StatScreen'
import { DarkAuroraBackground } from '@/components/ui/dark-aurora-background'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ChessEngine | In-House Chess Platform',
  description:
    'A client-side chess application with an in-house engine and peer-to-peer multiplayer.',
}

export default function Home() {
  return (
    <DarkAuroraBackground>
      <div className='mx-auto flex min-h-screen max-w-7xl items-center justify-center gap-7 px-0 py-2 max-lg:flex-col sm:p-8 lg:gap-12'>
        <div className='flex w-full flex-1 items-center justify-center'>
          <ChessBoard />
        </div>

        <div className='flex w-full max-w-md flex-1 items-center justify-center px-3 sm:px-0'>
          <StatScreen />
        </div>
      </div>
    </DarkAuroraBackground>
  )
}
