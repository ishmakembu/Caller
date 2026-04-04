import { customAlphabet } from 'nanoid'

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
const nanoid = customAlphabet(alphabet, 10)

export function generateRoomId(): string {
  return nanoid()
}

export function validateRoomId(id: string): boolean {
  return /^[a-z0-9]{1,20}$/.test(id)
}

export function extractRoomIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const id = parts[0]
    return id && validateRoomId(id) ? id : null
  } catch {
    if (validateRoomId(url)) return url
    return null
  }
}
