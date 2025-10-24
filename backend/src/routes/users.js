import express from 'express';
import bcrypt from 'bcrypt';
import { validateInput, authenticateToken } from '../middleware/index.js';
import { generateToken } from '../utils/jwt.js';
import { query, queryOne } from '../config/db.js';

const router = express.Router();

// ==================== USER AUTHENTICATION ====================

// POST /api/users/verify - Verify user (Login)
router.post('/verify', async (req, res) => {
  try {
    const { email, google_id, password } = req.body;
    
    if (!email && !google_id) {
      return res.status(400).json({
        success: false,
        message: 'Email or Google ID is required for verification'
      });
    }
    
    // Find user by email or google_id
    let user;
    if (google_id) {
      user = await queryOne('SELECT * FROM USER WHERE google_id = ?', [google_id]);
    } else if (email) {
      user = await queryOne('SELECT * FROM USER WHERE email = ?', [email]);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }
    
    // If verifying by email and body includes password, validate it
    if (!google_id && password) {
      const passwordValid = await bcrypt.compare(password, user.password || '');
      if (!passwordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
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
    const { google_id, email, username, bio, profile_pic, password } = req.body;
    
    // Check if user already exists
    let existingUser;
    if (google_id && email) {
      existingUser = await queryOne(
        'SELECT * FROM USER WHERE google_id = ? OR email = ?',
        [google_id, email]
      );
    } else if (google_id) {
      existingUser = await queryOne('SELECT * FROM USER WHERE google_id = ?', [google_id]);
    } else if (email) {
      existingUser = await queryOne('SELECT * FROM USER WHERE email = ?', [email]);
    }
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or Google ID already exists'
      });
    }
    
    // Hash password if provided
    let hashed = null;
    if (password) {
      const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');
      hashed = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Insert new user
    const defaultUsername = username || (email ? email.split('@')[0] : 'user');
    const result = await query(
      `INSERT INTO USER (google_id, email, password, username, bio, profile_pic, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [google_id || null, email, hashed, defaultUsername, bio || null, profile_pic || null]
    );
    
    // Fetch the created user
    const newUser = await queryOne('SELECT * FROM USER WHERE user_id = ?', [result.insertId]);
    
    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Email or Google ID already exists'
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
    const { search } = req.query;
    
    let sql = 'SELECT * FROM USER';
    const params = [];
    
    // Search by username or email
    if (search) {
      sql += ' WHERE username LIKE ? OR email LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    // Get users
    const users = await query(sql, params);
    
    res.json({
      success: true,
      data: users,
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
    
    const user = await queryOne('SELECT * FROM USER WHERE user_id = ?', [userId]);
    
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
    
    const user = await queryOne('SELECT * FROM USER WHERE user_id = ?', [id]);
    
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
    
    const user = await queryOne('SELECT * FROM USER WHERE user_id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await queryOne('SELECT * FROM USER WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }
    
    // Update user fields
    await query(
      `UPDATE USER SET 
        email = ?, 
        username = ?, 
        bio = ?, 
        profile_pic = ? 
       WHERE user_id = ?`,
      [
        email || user.email,
        username || user.username,
        bio !== undefined ? bio : user.bio,
        profile_pic !== undefined ? profile_pic : user.profile_pic,
        id
      ]
    );
    
    // Fetch updated user
    const updatedUser = await queryOne('SELECT * FROM USER WHERE user_id = ?', [id]);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: Email already exists'
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
    
    const user = await queryOne('SELECT * FROM USER WHERE user_id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await query('DELETE FROM USER WHERE user_id = ?', [id]);
    
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
    
    const user = await queryOne('SELECT * FROM USER WHERE user_id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's posts
    const posts = await query(
      'SELECT post_id, media_url, caption, created_at FROM POST WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    res.json({
      success: true,
      data: {
        user,
        posts,
        stats: {
          total_posts: posts.length
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