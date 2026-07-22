import { io, Socket } from 'socket.io-client';
import { API_URL } from './constants';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    try {
      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socket.on('connect_error', () => {});
    } catch (e) {
      console.warn('Socket init error:', e);
    }
  }
  return socket!;
}

export function registerSocket(userId: string): void {
  try {
    const s = getSocket();
    if (!s) return;
    if (s.connected) {
      s.emit('register', userId);
    } else {
      s.on('connect', () => {
        s.emit('register', userId);
      });
    }
  } catch (e) {
    console.warn('Socket register error:', e);
  }
}

export function joinConversation(conversationId: string): void {
  getSocket().emit('join-conversation', conversationId);
}

export function leaveConversation(conversationId: string): void {
  getSocket().emit('leave-conversation', conversationId);
}

export function sendMessageEvent(conversationId: string, message: any): void {
  getSocket().emit('new-message', { conversationId, message });
}

export function startTyping(conversationId: string): void {
  getSocket().emit('typing', { conversationId });
}

export function stopTyping(conversationId: string): void {
  getSocket().emit('stop-typing', { conversationId });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
