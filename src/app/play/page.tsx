import { BotGameControls } from '@/components/chess/BotGameControls'
import { ChessBoard } from '@/components/chess/ChessBoard'
import { DarkAuroraBackground } from '@/components/ui/dark-aurora-background'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play vs Bot | ChessEngine',
  description:
    'Play against the in-house chess engine with customizable difficulty and piece color selection.',
}

export default function PlayBotPage() {
  return (
    <DarkAuroraBackground>
      <div className='mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 max-lg:flex-col sm:p-8 lg:gap-12'>
        <div className='flex flex-1 items-center justify-center'>
          <ChessBoard />
        </div>

        <div className='flex w-full max-w-md flex-1 items-center justify-center'>
          <BotGameControls />
        </div>
      </div>
    </DarkAuroraBackground>
  )
}
