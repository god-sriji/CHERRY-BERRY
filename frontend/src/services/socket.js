import { io } from 'socket.io-client';

// Use same origin in production, localhost in development
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:3002');

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  registerUser(userId) {
    if (this.socket) {
      this.socket.emit('register_user', userId);
      console.log('✅ User registered with socket:', userId);
    }
  }

  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  offMessagesRead() {
    if (this.socket) {
      this.socket.off('messages_read');
    }
  }

  onMessageUpdated(callback) {
    if (this.socket) {
      this.socket.on('message_updated', callback);
    }
  }

  offMessageUpdated() {
    if (this.socket) {
      this.socket.off('message_updated');
    }
  }

  onNewChat(callback) {
    if (this.socket) {
      this.socket.on('new_chat', callback);
    }
  }

  offNewChat() {
    if (this.socket) {
      this.socket.off('new_chat');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
