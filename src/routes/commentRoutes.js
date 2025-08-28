import express from 'express';
import multer from 'multer';
import fs from 'fs';
import {
  createComment,
  getComments,
  addReply,
  updateReaction,
  deleteComment,
  deleteReply,
  getCommentStats,
  searchComments
} from '../controllers/commentController.js';
import compressImage from '../middleware/imageCompression.js';
import path from 'path'; // Added missing import for path

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 2 // Maximum 2 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create a new comment with image upload
router.post('/create', 
  upload.array('images', 2), // Allow up to 2 images
  compressImage,
  createComment
);

// Get comments for a specific page
router.get('/page/:pageId', getComments);

// Add a reply to a comment
router.post('/:commentId/reply', addReply);

// Update like/dislike count
router.patch('/:commentId/reaction', updateReaction);

// Delete a comment
router.delete('/:commentId', deleteComment);

// Delete a reply
router.delete('/:commentId/reply/:replyIndex', deleteReply);

// Get comment statistics
router.get('/stats/:pageId', getCommentStats);

// Search comments
router.get('/search/:pageId', searchComments);

export default router; 