type Room = {
  id: string
  peers: string[]
}

// Very small in-memory registry for MVP
const rooms: Record<string, Room> = {}

export const getRoom = (id: string): Room | null => rooms[id] ?? null
export const createRoom = (id: string): Room => {
  const r: Room = { id, peers: [] }
  rooms[id] = r
  return r
}
export const addPeerToRoom = (id: string, peerId: string) => {
  const r = getRoom(id)
  if (!r) return
  if (!r.peers.includes(peerId)) r.peers.push(peerId)
}
export const removePeerFromRoom = (id: string, peerId: string) => {
  const r = getRoom(id)
  if (!r) return
  r.peers = r.peers.filter((p) => p !== peerId)
}
