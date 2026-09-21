'use client'

import React, { useState } from 'react'
import { Copy, Check, QrCode, Link2, Radio, X } from 'lucide-react'
import { QRCodeDisplay } from './QRCodeDisplay'

interface ShareInviteModalProps {
  isOpen: boolean
  inviteUrl: string
  offerCode: string
  onClose: () => void
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  isOpen,
  inviteUrl,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md duration-200'>
      <div className='relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 p-6 text-white shadow-2xl'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white'
          aria-label='Close modal'>
          <X className='h-5 w-5' />
        </button>

        {/* Header */}
        <div className='mb-5 flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-400'>
            <Radio className='h-5 w-5 animate-pulse' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>
              Invite a Friend
            </h3>
            <p className='text-xs text-neutral-400'>
              Share this link or QR code to connect
            </p>
          </div>
        </div>

        {/* Live Radar animation */}
        <div className='mb-5 flex items-center gap-2.5 rounded-xl border border-teal-500/20 bg-teal-950/40 px-3.5 py-2.5 text-xs text-teal-300'>
          <span className='relative flex h-2.5 w-2.5'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75'></span>
            <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500'></span>
          </span>
          <span className='font-medium'>
            Waiting for opponent to open invite link...
          </span>
        </div>

        {/* Tab selector between Link and QR */}
        <div className='mb-4 flex gap-2 rounded-xl border border-white/5 bg-black/40 p-1'>
          <button
            onClick={() => setShowQR(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all ${
              !showQR
                ? 'border border-white/10 bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}>
            <Link2 className='h-3.5 w-3.5' />
            Share Link
          </button>
          <button
            onClick={() => setShowQR(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all ${
              showQR
                ? 'border border-white/10 bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}>
            <QrCode className='h-3.5 w-3.5' />
            QR Code
          </button>
        </div>

        {/* Content Body */}
        {!showQR ? (
          <div className='space-y-4'>
            <div className='relative'>
              <input
                type='text'
                readOnly
                value={inviteUrl}
                className='w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-xs text-neutral-300 select-all focus:outline-none'
              />
            </div>

            <button
              onClick={handleCopyLink}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium shadow-lg transition-all ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-teal-500 font-semibold text-neutral-950 shadow-teal-950/40 hover:bg-teal-400 active:scale-[0.99]'
              }`}>
              {copied ? (
                <>
                  <Check className='h-4 w-4' />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className='h-4 w-4' />
                  Copy Direct Invite Link
                </>
              )}
            </button>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center space-y-3 py-2'>
            <QRCodeDisplay value={inviteUrl} size={240} />
            <p className='text-center text-xs text-neutral-400'>
              Scan with mobile camera to join instantly
            </p>
          </div>
        )}

        {/* Footer info */}
        <div className='mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-neutral-500'>
          <span>P2P Encrypted • No Account Needed</span>
          <button
            onClick={onClose}
            className='text-neutral-400 transition-colors hover:text-white'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
