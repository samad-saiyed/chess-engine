import { ChessBoard } from '@/components/chess/ChessBoard'
import { StatScreen } from '@/components/stats/StatScreen'
import { DarkAuroraBackground } from '@/components/ui/dark-aurora-background'

export default function Home() {
  return (
    <DarkAuroraBackground>
      <div className='flex min-h-screen p-4 max-lg:flex-col sm:p-8'>
        <div className='flex flex-1 items-center justify-center'>
          <ChessBoard />
        </div>

        <div className='flex flex-1 items-center'>
          <StatScreen />
        </div>
      </div>
    </DarkAuroraBackground>
  )
}
