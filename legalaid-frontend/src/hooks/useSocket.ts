import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNotificationStore } from '../store/notificationStore';
import type { AppNotification } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const pushNotification = useNotificationStore((s) => s.push);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!user || !token) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { token });
      setConnected(true);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification:new', (n: AppNotification) => pushNotification(n));

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return { connected };
}
