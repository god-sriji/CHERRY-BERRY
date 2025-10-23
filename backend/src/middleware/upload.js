import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage for media messages (images, videos, audio)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/media'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for media types
const mediaFileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|mov|avi|webm/;
  const allowedAudioTypes = /mp3|wav|ogg|m4a|aac/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  const isImage = allowedImageTypes.test(extname) && mimetype.startsWith('image/');
  const isVideo = allowedVideoTypes.test(extname) && mimetype.startsWith('video/');
  const isAudio = allowedAudioTypes.test(extname) && mimetype.startsWith('audio/');
  
  if (isImage || isVideo || isAudio) {
    cb(null, true);
  } else {
    cb(new Error('Only image, video, and audio files are allowed!'), false);
  }
};

// Upload middleware for media messages
export const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
}).single('media');
