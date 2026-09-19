import { ChessBoard } from '@/components/chess/ChessBoard'
import { DarkAuroraBackground } from '@/components/ui/dark-aurora-background'

export default function Home() {
  return (
    <DarkAuroraBackground>
      <div className='flex min-h-screen items-center justify-center p-4 sm:p-8'>
        <ChessBoard />
      </div>
    </DarkAuroraBackground>
  )
}
