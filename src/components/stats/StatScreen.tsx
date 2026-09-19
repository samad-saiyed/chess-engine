'use client'
import { useChessStore } from '@/store/useChessStore'
import { Button } from '../ui/button'
import { MoveHistory } from '../chess/MoveHistory'

export const StatScreen = () => {
  const resetGame = useChessStore((state) => state.resetGame)
  const isGameStarted = useChessStore((state) => !!state.moveHistory?.length)
  return (
    <div className='h-max w-full rounded-xl bg-black/30 p-4 text-white'>
      {isGameStarted ? (
        <>
          <MoveHistory />

          <div className='flex w-full flex-col gap-3 mt-4'>
            <Button onClick={resetGame} className={'text-md h-12'}>
              Start new game?
            </Button>
          </div>
        </>
      ) : (
        <div className='flex w-full flex-col gap-3'>
          <Button onClick={resetGame} className={'text-md h-12'}>
            Play with a bot
          </Button>
          <Button onClick={resetGame} className={'text-md h-12'}>
            Play with a friend
          </Button>
        </div>
      )}
    </div>
  )
}
