import express from 'express';
import { Chat, User } from '../models/index.js';
import { authenticateToken } from '../middleware/index.js';

const router = express.Router();

// POST /api/chats - Create new chat
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user2_id } = req.body;
    const user1_id = req.user.user_id;

    if (!user2_id) {
      return res.status(400).json({
        success: false,
        message: 'user2_id is required'
      });
    }

    if (user1_id === user2_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    // Check if user2 exists
    const user2 = await User.findByPk(user2_id);
    if (!user2) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure user1_id < user2_id for consistent ordering
    const [smallerId, largerId] = user1_id < user2_id ? [user1_id, user2_id] : [user2_id, user1_id];

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      where: {
        user1_id: smallerId,
        user2_id: largerId
      }
    });

    if (existingChat) {
      // Still emit event in case the other user doesn't have it in their list yet
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${smallerId}`).emit('new_chat', {
          chat: existingChat,
          otherUserId: largerId
        });
        io.to(`user_${largerId}`).emit('new_chat', {
          chat: existingChat,
          otherUserId: smallerId
        });
      }
      
      return res.status(200).json({
        success: true,
        data: existingChat,
        message: 'Chat already exists'
      });
    }

    // Create new chat
    const newChat = await Chat.create({
      user1_id: smallerId,
      user2_id: largerId
    });

    // Get socket.io instance and emit new chat event to both users
    const io = req.app.get('io');
    if (io) {
      // Emit to both users involved in the chat
      io.to(`user_${smallerId}`).emit('new_chat', {
        chat: newChat,
        otherUserId: largerId
      });
      io.to(`user_${largerId}`).emit('new_chat', {
        chat: newChat,
        otherUserId: smallerId
      });
    }

    res.status(201).json({
      success: true,
      data: newChat,
      message: 'Chat created successfully'
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/chats - Get all chats for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { Op } = await import('sequelize');

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      },
      order: [['last_message_at', 'DESC']]
    });

    // Fetch user details for each chat
    const chatsWithUsers = await Promise.all(chats.map(async (chat) => {
      const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      const otherUser = await User.findByPk(otherUserId, {
        attributes: ['user_id', 'username', 'profile_pic']
      });

      return {
        chat_id: chat.chat_id,
        user1_id: chat.user1_id,
        user2_id: chat.user2_id,
        last_message_at: chat.last_message_at,
        other_user: otherUser
      };
    }));

    res.json({
      success: true,
      data: chatsWithUsers,
      message: 'Chats retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/chats/:id - Delete chat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const chat = await Chat.findByPk(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Verify user is part of the chat
    if (chat.user1_id !== userId && chat.user2_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this chat'
      });
    }

    await chat.destroy();

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
