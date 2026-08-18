import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../../services/socket';
import useAuthStore from '../../store/authStore';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connected', 'connecting', 'reconnecting', 'disconnected'

  useEffect(() => {
    if (isAuthenticated) {
      setConnectionState('connecting');
      const socket = socketService.connect();

      const onConnect = () => setConnectionState('connected');
      const onDisconnect = () => setConnectionState('disconnected');
      const onConnectError = () => setConnectionState('disconnected');
      
      // socket.io-client specific reconnect events
      const onReconnectAttempt = () => setConnectionState('reconnecting');
      const onReconnect = () => setConnectionState('connected');
      const onReconnectError = () => setConnectionState('disconnected');
      const onReconnectFailed = () => setConnectionState('disconnected');

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);
      socket.io.on('reconnect_attempt', onReconnectAttempt);
      socket.io.on('reconnect', onReconnect);
      socket.io.on('reconnect_error', onReconnectError);
      socket.io.on('reconnect_failed', onReconnectFailed);

      if (socket.connected) {
        setConnectionState('connected');
      }

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
        socket.io.off('reconnect_attempt', onReconnectAttempt);
        socket.io.off('reconnect', onReconnect);
        socket.io.off('reconnect_error', onReconnectError);
        socket.io.off('reconnect_failed', onReconnectFailed);
        socketService.disconnect();
      };
    } else {
      socketService.disconnect();
      setConnectionState('disconnected');
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ connectionState, socket: socketService }}>
      {children}
    </SocketContext.Provider>
  );
};
