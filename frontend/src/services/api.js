import axios from 'axios';

// Use relative URL when in production (served from same origin)
// Use localhost in development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3002/api');

// Export base URL for media files (without /api)
export const BASE_URL = API_URL.replace('/api', '');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User API
export const userAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Verify user (login)
  verify: async (email, google_id = null, password = null) => {
    const body = { email };
    if (google_id) body.google_id = google_id;
    if (password) body.password = password;
    const response = await api.post('/users/verify', body);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
  
  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  // Create new chat
  createChat: async (user2_id) => {
    const response = await api.post('/chats', { user2_id });
    return response.data;
  },

  // Get all chats
  getChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },
};

// Post API
export const postAPI = {
  // Create new post
  createPost: async (formData) => {
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all posts (FYP)
  getAllPosts: async (page = 1, limit = 20) => {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get posts by user
  getUserPosts: async (userId) => {
    const response = await api.get(`/posts/user/${userId}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};

// Message API
export const messageAPI = {
  // Send text message
  sendMessage: async (chat_id, message_text) => {
    const response = await api.post('/messages', { chat_id, message_text });
    return response.data;
  },

  // Send media message (image, video, audio)
  sendMediaMessage: async (chat_id, mediaFile, message_text = '') => {
    const formData = new FormData();
    formData.append('chat_id', chat_id);
    formData.append('media', mediaFile);
    if (message_text) {
      formData.append('message_text', message_text);
    }
    
    const response = await api.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get messages for a chat
  getMessages: async (chatId) => {
    const response = await api.get(`/messages/${chatId}`);
    return response.data;
  },

  // Edit message
  editMessage: async (messageId, message_text) => {
    const response = await api.put(`/messages/${messageId}`, { message_text });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};

// Block API
export const blockAPI = {
  // Block a user
  blockUser: async (blocked_id) => {
    const response = await api.post('/blocks', { blocked_id });
    return response.data;
  },

  // Unblock a user
  unblockUser: async (blocked_id) => {
    const response = await api.delete(`/blocks/${blocked_id}`);
    return response.data;
  },

  // Get list of blocked users
  getBlockedUsers: async () => {
    const response = await api.get('/blocks');
    return response.data;
  },

  // Check if a user is blocked
  checkBlockStatus: async (user_id) => {
    const response = await api.get(`/blocks/check/${user_id}`);
    return response.data;
  },
};

export default api;
