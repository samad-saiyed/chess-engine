'use client'
import { useChessStore } from '@/store/useChessStore'
import { Button } from '../ui/button'

export const StatScreen = () => {
  const resetGame = useChessStore((state) => state.resetGame)
  return (
    <div className='h-max w-full rounded-xl bg-black/30 p-4 text-white'>
      <div className='flex flex-col w-full gap-3'>
        <Button onClick={resetGame} className={'h-12 text-md'}>
          Play with a bot
        </Button>
        <Button onClick={resetGame} className={'h-12 text-md'}>
          Play with a friend
        </Button>
      </div>
    </div>
  )
}
