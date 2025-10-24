import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne } from '../config/db.js';
import { authenticateToken } from '../middleware/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/posts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(extname) && file.mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// POST /api/posts - Create new post
router.post('/', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.user_id;

    if (!req.file && !caption) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either media or caption'
      });
    }

    const mediaUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;
    const mediaType = req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : null;

    const result = await query(
      'INSERT INTO POST (user_id, media_url, media_type, caption) VALUES (?, ?, ?, ?)',
      [userId, mediaUrl, mediaType, caption || null]
    );

    const newPost = await queryOne('SELECT * FROM POST WHERE post_id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: newPost,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/posts - Get all posts (FYP - For You Page)
router.get('/', async (req, res) => {
  try {
    const posts = await query(
      `SELECT p.*, 
              u.user_id, u.username, u.profile_pic
       FROM POST p
       LEFT JOIN USER u ON p.user_id = u.user_id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: posts,
      message: 'Posts retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/posts/user/:userId - Get posts by specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await query(
      `SELECT p.*, 
              u.user_id, u.username, u.profile_pic
       FROM POST p
       LEFT JOIN USER u ON p.user_id = u.user_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: posts,
      message: 'User posts retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const post = await queryOne(
      `SELECT p.*, 
              u.user_id, u.username, u.profile_pic
       FROM POST p
       LEFT JOIN USER u ON p.user_id = u.user_id
       WHERE p.post_id = ?`,
      [id]
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post,
      message: 'Post retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const post = await queryOne('SELECT * FROM POST WHERE post_id = ?', [id]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Verify user owns the post
    if (post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this post'
      });
    }

    await query('DELETE FROM POST WHERE post_id = ?', [id]);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
