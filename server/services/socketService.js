import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

/**
 * Initializes Socket.IO with CORS and JWT authentication.
 *
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
export const initSocket = (httpServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication Middleware for Socket Handshakes
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
      const decoded = jwt.verify(token, secret);

      socket.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    const userRole = socket.user?.role;

    if (userId) {
      // Join user-specific private room
      socket.join(`user:${userId}`);
    }

    if (userRole === 'admin') {
      // Join admin broadcast room
      socket.join('admin:room');
    }

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

/**
 * Returns the active Socket.IO server instance.
 */
export const getIO = () => {
  return io;
};

/**
 * Emits an event to a specific user's private room.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} event
 * @param {Object} data
 */
export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

/**
 * Emits an event to all connected administrators.
 *
 * @param {string} event
 * @param {Object} data
 */
export const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin:room').emit(event, data);
  }
};
