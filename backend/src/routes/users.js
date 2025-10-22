import express from 'express';
import { User } from '../models/index.js';
import { validateInput, authenticateToken } from '../middleware/index.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();

// ==================== USER AUTHENTICATION ====================

// POST /api/users/verify - Verify user (Login)
router.post('/verify', async (req, res) => {
  try {
    const { email, google_id } = req.body;
    
    if (!email && !google_id) {
      return res.status(400).json({
        success: false,
        message: 'Email or Google ID is required for verification'
      });
    }
    
    // Find user by email or google_id
    const whereClause = {};
    if (google_id) {
      whereClause.google_id = google_id;
    } else if (email) {
      whereClause.email = email;
    }
    
    const user = await User.findOne({ where: whereClause });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        user: user,
        token: token
      },
      message: 'User verified successfully'
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== USER CRUD OPERATIONS ====================

// POST /api/users - Create new user (Register)
router.post('/', validateInput(['email']), async (req, res) => {
  try {
    const { google_id, email, username, bio, profile_pic } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        ...(google_id && { google_id }),
        ...(email && { email })
      } 
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or Google ID already exists'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      google_id,
      email,
      username: username || email.split('@')[0], // Default username from email
      bio,
      profile_pic
    });
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    // Search by username or email
    if (search) {
      const { Op } = await import('sequelize');
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['google_id'] } // Don't expose google_id in list
    });
    
    res.json({
      success: true,
      data: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(users.count / limit)
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/me - Get current user from token (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user contains decoded token data
    const userId = req.user.user_id;  // ✅ Get user_id from token
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Current user retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving current user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['google_id'] } // Don't expose google_id
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, bio, profile_pic } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Update user fields
    await user.update({
      email: email || user.email,
      username: username || user.username,
      bio: bio !== undefined ? bio : user.bio,
      profile_pic: profile_pic !== undefined ? profile_pic : user.profile_pic
    });
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.json({
      success: true,
      message: 'User deleted successfully. All associated posts, messages, and chats have been removed.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== PROFILE OPERATIONS ====================

// GET /api/users/:id/profile - Get user profile with stats
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { Post } = await import('../models/index.js');
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['google_id'] },
      include: [
        {
          model: Post,
          attributes: ['post_id', 'media_url', 'caption', 'created_at']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          total_posts: user.Posts ? user.Posts.length : 0
        }
      },
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;