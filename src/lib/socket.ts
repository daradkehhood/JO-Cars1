'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let registered = false;

export function getSocket(userId?: string): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      // polling-first is more tolerant on flaky mobile networks; websocket
      // upgrades happen automatically once a stable connection is available.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
    });
    socket.on('connect', () => {
      if (userId) {
        socket?.emit('register', userId);
        registered = true;
      }
    });
  } else if (userId && !registered) {
    socket.emit('register', userId);
    registered = true;
  }
  return socket;
}

export function isUserOnline(userId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('check-online', userId);
    s.once('user-status', (data: { userId: string; online: boolean }) => {
      if (data.userId === userId) resolve(data.online);
      else resolve(false);
    });
    setTimeout(() => resolve(false), 3000);
  });
}

export function disconnectSocket() {
  if (socket) {
    registered = false;
    socket.disconnect();
    socket = null;
  }
}
