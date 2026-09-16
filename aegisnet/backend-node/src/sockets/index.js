// sockets/index.js — Socket.IO room setup and emit helper
let io;

const init = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    socket.join('dashboard');
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emit = (event, data) => {
  if (io) io.to('dashboard').emit(event, data);
};

module.exports = { init, emit };
