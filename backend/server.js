import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { testConnection, syncDatabase } from './src/config/database.js';
import usersRouter from './src/routes/users.js';
import chatsRouter from './src/routes/chats.js';
import postsRouter from './src/routes/posts.js';
import messagesRouter from './src/routes/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3002',  // When frontend is served from backend
  'http://192.168.1.7:5173',
  'http://192.168.1.7:3002',  // Network access when served from backend
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,  // Allow any local network IP
  /^https:\/\/.*\.trycloudflare\.com$/,  // Allow any Cloudflare tunnel
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(httpServer, {
  cors: corsOptions
});

const PORT = process.env.PORT || 3002;

// Configure helmet with proper CSP settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "http://192.168.1.7:3002"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http://192.168.1.7:3002", ...allowedOrigins.filter(o => typeof o === 'string')],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      connectSrc: ["'self'", "http://192.168.1.7:3002", "https://accounts.google.com", "https://apis.google.com", "https://www.googleapis.com", ...allowedOrigins.filter(o => typeof o === 'string')],
      frameSrc: ["'self'", "https://accounts.google.com"],
      formAction: ["'self'", "https://accounts.google.com"],
      frameAncestors: ["'self'", "https://accounts.google.com"]
    }
  }
}));

app.use(compression());
app.use(cors(corsOptions));
app.use(morgan('dev')); // Cleaner format: :method :url :status :response-time ms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with CORS headers
app.use('/uploads', cors(corsOptions), express.static('uploads'));

// API routes - all under /api/
app.get('/api/health', (req, res) => res.json({ status: 'healthy' }));
app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/messages', messagesRouter);

// Test OAuth page (for debugging)
app.get('/test-oauth', (req, res) => {
  res.sendFile(join(__dirname, 'test-oauth.html'));
});

// Serve frontend static files (assets like CSS, JS, images)
app.use(express.static(join(__dirname, '../frontend/dist')));

// Catch-all route - serve React app for all non-API routes (must be last)
app.get('*', (req, res, next) => {
  // Don't intercept API or upload routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  
  // Serve React app for all other routes
  res.sendFile(join(__dirname, '../frontend/dist/index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.status(404).send('Not found');
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user ID with socket for targeted notifications
  socket.on('register_user', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

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
    if (socket.userId) {
      console.log(`User ${socket.userId} disconnected:`, socket.id);
    } else {
      console.log('User disconnected:', socket.id);
    }
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
