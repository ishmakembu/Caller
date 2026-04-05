const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  const rooms = new Map()

  function getRoom(id) {
    return rooms.get(id)
  }

  function createRoom(id, hostSocketId) {
    const room = {
      id,
      peers: new Map(),
      hostSocketId,
    }
    rooms.set(id, room)
    return room
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join', ({ roomId, displayName }) => {
      let room = getRoom(roomId)
      const isFirstPeer = !room || room.peers.size === 0

      if (!room) {
        room = createRoom(roomId, socket.id)
      }

      room.peers.set(socket.id, {
        socketId: socket.id,
        displayName,
      })

      socket.join(roomId)
      socket.data.roomId = roomId
      socket.data.displayName = displayName

      const peerList = Array.from(room.peers.values()).map((p) => ({
        socketId: p.socketId,
        displayName: p.displayName,
      }))

      socket.emit('room:joined', {
        roomId,
        peers: peerList,
        isHost: isFirstPeer,
        yourSocketId: socket.id,
      })

      socket.to(roomId).emit('peer:joined', {
        socketId: socket.id,
        displayName,
      })

      console.log(`Peer ${displayName} (${socket.id}) joined room ${roomId}`)
    })

    socket.on('signal:offer', ({ targetSocketId, offer }) => {
      const roomId = socket.data.roomId
      if (!roomId) return
      io.to(targetSocketId).emit('signal:offer', {
        senderSocketId: socket.id,
        offer,
      })
    })

    socket.on('signal:answer', ({ targetSocketId, answer }) => {
      const roomId = socket.data.roomId
      if (!roomId) return
      io.to(targetSocketId).emit('signal:answer', {
        senderSocketId: socket.id,
        answer,
      })
    })

    socket.on('signal:ice-candidate', ({ targetSocketId, candidate }) => {
      const roomId = socket.data.roomId
      if (!roomId) return
      io.to(targetSocketId).emit('signal:ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      })
    })

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId
      if (!roomId) return

      const room = getRoom(roomId)
      if (!room) return

      const peer = room.peers.get(socket.id)
      room.peers.delete(socket.id)

      if (room.peers.size === 0) {
        rooms.delete(roomId)
        console.log(`Room ${roomId} deleted (empty)`)
      } else {
        if (room.hostSocketId === socket.id) {
          const newHost = room.peers.keys().next().value
          if (newHost) {
            room.hostSocketId = newHost
            io.to(newHost).emit('room:host-changed')
          }
        }
      }

      socket.to(roomId).emit('peer:left', {
        socketId: socket.id,
      })

      console.log(`Peer ${peer?.displayName ?? socket.id} left room ${roomId}`)
    })
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})