import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3036';

// Define the shape of the context
interface ISocketContext {
  socket: Socket | null;
  isConnected: boolean;
}

// Create the context
const SocketContext = createContext<ISocketContext | undefined>(undefined);

// Create a custom hook to easily access the context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Create the Provider component
interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // We only want to connect if the user is authenticated
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Create the socket connection, passing the token for our middleware
      const newSocket = io(apiUrl, {
        auth: {
          token: token
        }
      });

      // Set up event listeners
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

      // Clean up on component unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, []); // Runs once on mount

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};