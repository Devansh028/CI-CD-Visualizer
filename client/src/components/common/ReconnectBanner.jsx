import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import socketService from "../../services/socket";

/**
 * Global banner warning users of socket disconnections.
 */
export const ReconnectBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Attempt socket resolve
    const socket = socketService.socket || socketService.connect();
    
    if (socket) {
      setIsConnected(socket.connected);
      
      const handleConnect = () => {
        setIsConnected(true);
        setIsReconnecting(false);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
        setIsReconnecting(true);
      };
      
      const handleConnectError = () => {
        setIsReconnecting(true);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
      };
    }
  }, []);

  if (isConnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-2 bg-amber-600/95 border-b border-amber-500/50 text-white backdrop-blur-md shadow-md animate-slide-down">
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
        <WifiOff size={14} className="animate-pulse" />
        <span>Connection lost. Attempting to reconnect to live stream...</span>
      </div>
    </div>
  );
};

export default ReconnectBanner;
