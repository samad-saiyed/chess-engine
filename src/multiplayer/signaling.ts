/**
 * Utilities to compress and encode WebRTC SDP offers/answers for URL sharing and QR codes.
 * Uses native browser CompressionStream (deflate-raw) to dramatically shrink SDP payloads.
 */

function minifySdp(sdp: string): string {
  // Strip out duplicate candidates or redundant blank lines
  const lines = sdp.split(/\r?\n/)
  const seenCandidates = new Set<string>()
  const filtered = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (trimmed.startsWith('a=candidate:')) {
      if (seenCandidates.has(trimmed)) return false
      seenCandidates.add(trimmed)
    }
    return true
  })
  return filtered.join('\r\n') + '\r\n'
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function encodeSessionDescription(
  description: RTCSessionDescriptionInit,
): Promise<string> {
  try {
    const minified = {
      type: description.type,
      sdp: description.sdp ? minifySdp(description.sdp) : '',
    }
    const json = JSON.stringify(minified)
    const rawBytes = new TextEncoder().encode(json)

    if (typeof CompressionStream !== 'undefined') {
      const cs = new CompressionStream('deflate-raw')
      const writer = cs.writable.getWriter()
      writer.write(rawBytes as unknown as BufferSource)
      writer.close()

      const response = new Response(cs.readable)
      const buffer = await response.arrayBuffer()
      const compressedBytes = new Uint8Array(buffer)
      return 'z_' + toBase64Url(compressedBytes)
    }

    return toBase64Url(rawBytes)
  } catch (err) {
    console.error('Failed to encode session description:', err)
    return ''
  }
}

export async function decodeSessionDescription(
  encoded: string,
): Promise<RTCSessionDescriptionInit | null> {
  try {
    if (!encoded) return null

    let json = ''

    if (encoded.startsWith('z_')) {
      const compressedPayload = encoded.slice(2)
      const compressedBytes = fromBase64Url(compressedPayload)

      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        writer.write(compressedBytes as unknown as BufferSource)
        writer.close()

        const response = new Response(ds.readable)
        const buffer = await response.arrayBuffer()
        json = new TextDecoder().decode(buffer)
      } else {
        throw new Error('DecompressionStream not supported')
      }
    } else {
      // Legacy uncompressed base64url
      const rawBytes = fromBase64Url(encoded)
      json = new TextDecoder().decode(rawBytes)
    }

    return JSON.parse(json) as RTCSessionDescriptionInit
  } catch (err) {
    console.error('Failed to decode session description:', err)
    return null
  }
}
