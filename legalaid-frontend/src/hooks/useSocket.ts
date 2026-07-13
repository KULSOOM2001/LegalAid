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
  console.log('✅ Socket connected:', socket.id);
  socket.emit('join', { token });
  setConnected(true);
});

socket.on('disconnect', () => setConnected(false));

socket.on('notification:new', (n: AppNotification) => {
  pushNotification(n);
  // Case-related notifications should also trigger a case-list refresh
  if (n.type === 'case:assigned' || n.type === 'case:status_changed' || n.type === 'case:high_urgency') {
    window.dispatchEvent(new CustomEvent('legalaid:case-updated'));
  }
});

// 👇 naya listener add karo — jab bhi backend "case:new" emit kare
socket.on('case:new', () => {
  window.dispatchEvent(new CustomEvent('legalaid:case-updated'));
});
}, [user?.id]);   // 👈 sirf id pe depend karo, poore object pe nahi

  return { connected };
}
