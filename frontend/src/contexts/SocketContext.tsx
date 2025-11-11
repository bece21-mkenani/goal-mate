import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL;

interface ISocketContext {
  socket: Socket | null;
  isConnected: boolean;
}

/*=== CREATING CONTEXT ===*/
const SocketContext = createContext<ISocketContext | undefined>(undefined);

/*=== CUSTOM HOOK TO USE CONTEXT ===*/
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/*=== SOCKET PROVIDER ===*/
interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const newSocket = io(apiUrl, {
        auth: {
          token: token
        }
      });
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket.io connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket.io disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket.io connection error:', err.message);
      });

      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
      };
    }
  }, []); 

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};