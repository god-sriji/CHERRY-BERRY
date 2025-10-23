import express from 'express';
import { Block, User } from '../models/index.js';
import { authenticateToken } from '../middleware/index.js';

const router = express.Router();

// POST /api/blocks - Block a user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.body;

    if (!blocked_id) {
      return res.status(400).json({
        success: false,
        message: 'blocked_id is required'
      });
    }

    // Check if trying to block yourself
    if (blocker_id === blocked_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Check if user exists
    const userToBlock = await User.findByPk(blocked_id);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({
      where: { blocker_id, blocked_id }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Create block
    const newBlock = await Block.create({
      blocker_id,
      blocked_id
    });

    res.status(201).json({
      success: true,
      data: newBlock,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/blocks/:blocked_id - Unblock a user
router.delete('/:blocked_id', authenticateToken, async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.params;

    const block = await Block.findOne({
      where: { blocker_id, blocked_id }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    await block.destroy();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/blocks - Get list of blocked users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const blocker_id = req.user.user_id;

    const blocks = await Block.findAll({
      where: { blocker_id },
      include: [{
        model: User,
        as: 'blocked',
        attributes: ['user_id', 'username', 'email', 'profile_pic']
      }],
      order: [['blocked_at', 'DESC']]
    });

    res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/blocks/check/:user_id - Check if a user is blocked
router.get('/check/:user_id', authenticateToken, async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { user_id } = req.params;

    const block = await Block.findOne({
      where: { blocker_id, blocked_id: user_id }
    });

    res.json({
      success: true,
      data: {
        is_blocked: !!block
      }
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking block status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
