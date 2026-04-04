// Very small in-memory registry for MVP
const rooms = {};
export const getRoom = (id) => rooms[id] ?? null;
export const createRoom = (id) => {
    const r = { id, peers: [] };
    rooms[id] = r;
    return r;
};
export const addPeerToRoom = (id, peerId) => {
    const r = getRoom(id);
    if (!r)
        return;
    if (!r.peers.includes(peerId))
        r.peers.push(peerId);
};
export const removePeerFromRoom = (id, peerId) => {
    const r = getRoom(id);
    if (!r)
        return;
    r.peers = r.peers.filter((p) => p !== peerId);
};
