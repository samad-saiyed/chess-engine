'use client'

import { GooeyToaster } from 'goey-toast'

export const ToastWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <GooeyToaster position='top-left' />
      {children}
    </>
  )
}
