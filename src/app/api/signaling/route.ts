import { NextResponse } from 'next/server'

interface RoomData {
  offer?: string
  answer?: string
  hostColor?: string
  timeControlId?: string
  hostName?: string
  createdAt: number
}

// In-memory room storage for signaling (expires after 10 minutes)
const rooms = new Map<string, RoomData>()

function cleanupOldRooms() {
  const now = Date.now()
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > 10 * 60 * 1000) {
      rooms.delete(id)
    }
  }
}

export async function GET(request: Request) {
  cleanupOldRooms()
  const { searchParams } = new URL(request.url)
  const room = searchParams.get('room')

  if (!room) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
  }

  const data = rooms.get(room)
  if (!data) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  cleanupOldRooms()
  try {
    const body = await request.json()
    const {
      room,
      offer,
      answer,
      hostColor,
      timeControlId,
      hostName,
      resetAnswer,
    } = body

    if (!room) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
    }

    const existing = rooms.get(room) || { createdAt: Date.now() }

    if (resetAnswer) {
      delete existing.answer
    }
    if (offer) {
      existing.offer = offer
      if (resetAnswer !== false) {
        delete existing.answer
      }
    }
    if (answer) existing.answer = answer
    if (hostColor) existing.hostColor = hostColor
    if (timeControlId) existing.timeControlId = timeControlId
    if (hostName) existing.hostName = hostName

    rooms.set(room, existing)
    return NextResponse.json({ success: true, room })
  } catch (err) {
    console.error('Signaling error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 500 })
  }
}
