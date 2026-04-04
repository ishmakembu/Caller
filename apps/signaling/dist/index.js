import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const rooms = new Map();
function getRoom(id) {
    return rooms.get(id);
}
function createRoom(id, hostSocketId) {
    const room = {
        id,
        peers: new Map(),
        hostSocketId,
    };
    rooms.set(id, room);
    return room;
}
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join', ({ roomId, displayName }) => {
        let room = getRoom(roomId);
        const isFirstPeer = !room || room.peers.size === 0;
        if (!room) {
            room = createRoom(roomId, socket.id);
        }
        room.peers.set(socket.id, {
            socketId: socket.id,
            displayName,
        });
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.displayName = displayName;
        const peerList = Array.from(room.peers.values()).map((p) => ({
            socketId: p.socketId,
            displayName: p.displayName,
        }));
        socket.emit('room:joined', {
            roomId,
            peers: peerList,
            isHost: isFirstPeer,
            yourSocketId: socket.id,
        });
        socket.to(roomId).emit('peer:joined', {
            socketId: socket.id,
            displayName,
        });
        console.log(`Peer ${displayName} (${socket.id}) joined room ${roomId}`);
    });
    socket.on('signal:offer', ({ targetSocketId, offer }) => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        io.to(targetSocketId).emit('signal:offer', {
            senderSocketId: socket.id,
            offer,
        });
    });
    socket.on('signal:answer', ({ targetSocketId, answer }) => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        io.to(targetSocketId).emit('signal:answer', {
            senderSocketId: socket.id,
            answer,
        });
    });
    socket.on('signal:ice-candidate', ({ targetSocketId, candidate }) => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        io.to(targetSocketId).emit('signal:ice-candidate', {
            senderSocketId: socket.id,
            candidate,
        });
    });
    socket.on('chat:message', ({ text }) => {
        const roomId = socket.data.roomId;
        const displayName = socket.data.displayName;
        if (!roomId || !displayName)
            return;
        io.to(roomId).emit('chat:message', {
            id: `${Date.now()}-${socket.id}`,
            senderId: socket.id,
            senderName: displayName,
            text,
            timestamp: Date.now(),
        });
    });
    socket.on('room:kick', ({ socketId }) => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        const room = getRoom(roomId);
        if (!room || room.hostSocketId !== socket.id)
            return;
        io.to(socketId).emit('room:kicked');
        io.sockets.sockets.get(socketId)?.leave(roomId);
        room.peers.delete(socketId);
        console.log(`Kicked peer ${socketId} from room ${roomId}`);
    });
    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        const room = getRoom(roomId);
        if (!room)
            return;
        const peer = room.peers.get(socket.id);
        room.peers.delete(socket.id);
        if (room.peers.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        }
        else {
            if (room.hostSocketId === socket.id) {
                const newHost = room.peers.keys().next().value;
                if (newHost) {
                    room.hostSocketId = newHost;
                    io.to(newHost).emit('room:host-changed');
                }
            }
        }
        socket.to(roomId).emit('peer:left', {
            socketId: socket.id,
        });
        console.log(`Peer ${peer?.displayName ?? socket.id} left room ${roomId}`);
    });
});
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
httpServer.listen(port, () => {
    console.log(`Signaling server listening on port ${port}`);
});
