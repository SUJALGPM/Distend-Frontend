import React, { createContext, useContext, useEffect } from 'react';
import { socketManager } from '@/lib/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  // Add socket-related methods here if needed
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to socket when user is authenticated
      // In a real app, you'd get the token from somewhere secure
      const token = 'dummy-token'; // This should be the actual JWT token
      socketManager.connect(token);
    } else {
      // Disconnect when user logs out
      socketManager.disconnect();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [user]);

  const value = {
    // Add socket-related methods here
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}