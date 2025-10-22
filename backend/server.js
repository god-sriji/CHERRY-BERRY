import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { testConnection, syncDatabase } from './src/config/database.js';
import usersRouter from './src/routes/users.js';
import chatsRouter from './src/routes/chats.js';
import postsRouter from './src/routes/posts.js';
import messagesRouter from './src/routes/messages.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3002;

// Configure helmet with proper CSP settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", process.env.FRONTEND_URL],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev')); // Cleaner format: :method :url :status :response-time ms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with CORS headers
app.use('/uploads', cors({ origin: process.env.FRONTEND_URL }), express.static('uploads'));

app.get('/', (req, res) => res.json({ message: 'Cherry Berry API', status: 'running' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/messages', messagesRouter);
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.id} joined chat_${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.id} left chat_${chatId}`);
  });

  // Handle message read status update
  socket.on('messages_read', ({ chatId, userId }) => {
    socket.to(`chat_${chatId}`).emit('messages_read_update', { chatId, userId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const startServer = async () => {
  await testConnection();
  await syncDatabase();
  httpServer.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
};

startServer();
