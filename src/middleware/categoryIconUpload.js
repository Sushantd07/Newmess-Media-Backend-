import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for category icon uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure frontend public category-icons directory exists
    const uploadDir = '../Frontend/public/category-icons';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a clean filename for the category icon
    const categoryName = req.body.categoryName || 'category';
    const cleanName = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `icon-${cleanName}${fileExtension}`);
  }
});

const categoryIconUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for all image files
    files: 1 // Only 1 file for icon
  },
  fileFilter: (req, file, cb) => {
    // Debug logging
    console.log('🔍 File upload attempt:');
    console.log('🔍 File name:', file.originalname);
    console.log('🔍 File mimetype:', file.mimetype);
    console.log('🔍 File size:', file.size, 'bytes');
    
    // Allow SVG and common image formats for category icons
    const allowedMimeTypes = [
      'image/svg+xml',    // SVG
      'image/png',        // PNG
      'image/jpeg',       // JPEG
      'image/jpg',        // JPG
      'image/gif',        // GIF
      'image/webp'        // WebP
    ];
    
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log('🔍 Allowed MIME types:', allowedMimeTypes);
    console.log('🔍 Allowed extensions:', allowedExtensions);
    console.log('🔍 File extension:', fileExtension);
    console.log('🔍 Is MIME type allowed?', allowedMimeTypes.includes(file.mimetype));
    console.log('🔍 Is extension allowed?', allowedExtensions.includes(fileExtension));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('✅ File accepted for upload');
      cb(null, true);
    } else {
      console.log('❌ File rejected - not in allowed types');
      cb(new Error('Only SVG, PNG, JPG, JPEG, GIF, and WebP files are allowed for category icons!'), false);
    }
  }
});

export default categoryIconUpload;

