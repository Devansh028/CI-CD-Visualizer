const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");
const { registerSocketEvents } = require("./socketEvents");

let io = null;

/**
 * Initialize Socket.IO server with JWT authentication.
 * 
 * @param {Object} server - HTTP Server instance
 * @returns {Object} Socket.IO server instance
 */
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // JWT Authentication Middleware for Socket.IO connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Authentication error. Token not found."));
      }

      const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || "fallback_secret");
      
      const user = await User.findById(decoded.id || decoded._id);
      if (!user) {
        return next(new Error("Authentication error. User not found."));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.warn(`Socket authentication failed: ${err.message}`);
      next(new Error("Authentication error. Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Authenticated Socket Client Connected: ${socket.id} (User: ${socket.user.name})`);
    
    // Join user-specific notification room
    const userId = socket.user._id || socket.user.id;
    socket.join(`user:${userId}`);
    
    // Register room subscription handlers and connection lifecycles
    registerSocketEvents(socket);
  });

  logger.info("Socket.IO server initialized with JWT security.");
  return io;
};

/**
 * Retrieve active Socket.IO instance.
 */
const getIO = () => {
  if (!io) {
    logger.error("Attempted to access Socket.IO server before initialization.");
    throw new Error("Socket.IO server has not been initialized yet.");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
