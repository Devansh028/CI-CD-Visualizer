import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
                   import.meta.env.VITE_API_URL?.replace("/api", "") || 
                   "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Establish connection to Socket.IO server.
   */
  connect() {
    if (this.socket?.connected) return this.socket;

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("[SocketService] No token found in localStorage, skipping connection.");
      return null;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Register active event listeners once on this new socket instance
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(cb => this.socket.on(event, cb));
    });

    this.socket.on("connect", () => {
      console.log(`[SocketService] Connected with socket ID: ${this.socket.id}`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[SocketService] Disconnected. Reason: ${reason}`);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketService] Connection error:", err.message);
    });

    return this.socket;
  }

  /**
   * Close socket connection.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("[SocketService] Socket connection terminated.");
    }
  }

  /**
   * Subscribe to a room for a deployment.
   */
  joinDeployment(deploymentId) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit("join-deployment", deploymentId);
    }
  }

  /**
   * Unsubscribe from a deployment room.
   */
  leaveDeployment(deploymentId) {
    if (this.socket) {
      this.socket.emit("leave-deployment", deploymentId);
    }
  }

  /**
   * Subscribe to a room for a project.
   */
  joinProject(projectId) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit("join-project", projectId);
    }
  }

  /**
   * Unsubscribe from a project room.
   */
  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit("leave-project", projectId);
    }
  }

  /**
   * Subscribe to metrics room.
   */
  joinMetrics() {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit("join-metrics");
    }
  }

  /**
   * Unsubscribe from metrics room.
   */
  leaveMetrics() {
    if (this.socket) {
      this.socket.emit("leave-metrics");
    }
  }

  /**
   * Register listener for specific real-time event.
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Deregister listener for specific real-time event.
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
