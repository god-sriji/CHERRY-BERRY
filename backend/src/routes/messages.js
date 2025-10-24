import express from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken } from '../middleware/index.js';
import { uploadMedia } from '../middleware/upload.js';
import path from 'path';

const router = express.Router();

// POST /api/messages - Send a message (text or media)
router.post('/', authenticateToken, uploadMedia, async (req, res) => {
  try {
    const { chat_id, message_text, message_type } = req.body;
    const sender_id = req.user.user_id;
    const mediaFile = req.file;

    // Validate: must have either text or media
    if (!chat_id || (!message_text && !mediaFile)) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and either message text or media file are required'
      });
    }

    // Verify user is part of this chat
    const chat = await queryOne(
      'SELECT * FROM CHAT WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
      [chat_id, sender_id, sender_id]
    );

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Determine message type based on file
    let finalMessageType = 'text';
    let finalMessageText = message_text || null;

    if (mediaFile) {
      const mimetype = mediaFile.mimetype;
      if (mimetype.startsWith('image/')) {
        finalMessageType = 'image';
      } else if (mimetype.startsWith('video/')) {
        finalMessageType = 'video';
      } else if (mimetype.startsWith('audio/')) {
        finalMessageType = 'audio';
      }
      // Store the file path as message_text for media messages
      finalMessageText = `/uploads/media/${mediaFile.filename}`;
    } else if (message_type) {
      finalMessageType = message_type;
    }

    const result = await query(
      'INSERT INTO MESSAGE (chat_id, sender_id, message_text, message_type) VALUES (?, ?, ?, ?)',
      [chat_id, sender_id, finalMessageText, finalMessageType]
    );

    // Update chat's last_message_at
    await query(
      'UPDATE CHAT SET last_message_at = NOW() WHERE chat_id = ?',
      [chat_id]
    );

    // Fetch the message with sender info
    const messageWithSender = await queryOne(
      `SELECT m.*, 
              u.user_id, u.username, u.profile_pic
       FROM MESSAGE m
       LEFT JOIN USER u ON m.sender_id = u.user_id
       WHERE m.message_id = ?`,
      [result.insertId]
    );

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chat_id}`).emit('new_message', messageWithSender);
    }

    res.status(201).json({
      success: true,
      data: messageWithSender,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/messages/:chatId - Get messages for a chat
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.user_id;

    // Verify user is part of this chat
    const chat = await queryOne(
      'SELECT * FROM CHAT WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
      [chatId, userId, userId]
    );

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    const messages = await query(
      `SELECT m.*, 
              u.user_id, u.username, u.profile_pic
       FROM MESSAGE m
       LEFT JOIN USER u ON m.sender_id = u.user_id
       WHERE m.chat_id = ?
       ORDER BY m.sent_at ASC`,
      [chatId]
    );

    // Mark ALL unread messages from other user as read (not just the latest)
    const updateResult = await query(
      'UPDATE MESSAGE SET is_read = TRUE WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE',
      [chatId, userId]
    );

    // Emit socket event if any messages were marked as read
    if (updateResult.affectedRows > 0) {
      const io = req.app.get('io');
      if (io) {
        io.to(`chat_${chatId}`).emit('messages_read', { chatId, userId });
      }
    }

    // Refetch messages to get updated is_read status
    const updatedMessages = await query(
      `SELECT m.*, 
              u.user_id, u.username, u.profile_pic
       FROM MESSAGE m
       LEFT JOIN USER u ON m.sender_id = u.user_id
       WHERE m.chat_id = ?
       ORDER BY m.sent_at ASC`,
      [chatId]
    );

    res.json({
      success: true,
      data: updatedMessages,
      message: 'Messages retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/messages/:chatId/mark-read - Mark all messages in a chat as read
router.put('/:chatId/mark-read', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.user_id;

    // Verify user is part of this chat
    const chat = await queryOne(
      'SELECT * FROM CHAT WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
      [chatId, userId, userId]
    );

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Mark all messages from other user as read
    await query(
      'UPDATE MESSAGE SET is_read = TRUE WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE',
      [chatId, userId]
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/messages/:messageId - Edit a message
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message_text } = req.body;
    const userId = req.user.user_id;

    if (!message_text || !message_text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Find the message
    const message = await queryOne('SELECT * FROM MESSAGE WHERE message_id = ?', [messageId]);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is the sender
    if (message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Update the message
    await query('UPDATE MESSAGE SET message_text = ? WHERE message_id = ?', [message_text.trim(), messageId]);

    // Fetch updated message with sender info
    const updatedMessage = await queryOne(
      `SELECT m.*, 
              u.user_id, u.username, u.profile_pic
       FROM MESSAGE m
       LEFT JOIN USER u ON m.sender_id = u.user_id
       WHERE m.message_id = ?`,
      [messageId]
    );

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${message.chat_id}`).emit('message_updated', updatedMessage);
    }

    res.json({
      success: true,
      data: updatedMessage,
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.user_id;

    // Find the message
    const message = await queryOne('SELECT * FROM MESSAGE WHERE message_id = ?', [messageId]);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Verify user is the sender
    if (message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Delete the message
    await query('DELETE FROM MESSAGE WHERE message_id = ?', [messageId]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
