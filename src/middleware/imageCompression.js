import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const compressImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const compressedFiles = [];
    const uploadDir = './uploads';

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of req.files) {
      if (!file.mimetype.startsWith('image/')) {
        continue; // Skip non-image files
      }

      // Check if file exists before processing
      if (!fs.existsSync(file.path)) {
        console.error('File does not exist:', file.path);
        continue;
      }

      const originalPath = file.path;
      const filename = path.basename(originalPath, path.extname(originalPath));
      const compressedPath = path.join(uploadDir, `${filename}_compressed.jpg`);

      try {
        // Compress image to 300KB
        await sharp(originalPath)
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 80,
            progressive: true,
            mozjpeg: true
          })
          .toFile(compressedPath);

        // Remove original file only if compression was successful
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        // Update file object
        file.path = compressedPath;
        file.filename = `${filename}_compressed.jpg`;
        file.mimetype = 'image/jpeg';
        file.size = fs.statSync(compressedPath).size;

        compressedFiles.push(file);
      } catch (sharpError) {
        console.error('Sharp compression error for file:', originalPath, sharpError);
        // If compression fails, keep the original file
        compressedFiles.push(file);
      }
    }

    req.files = compressedFiles;
    next();
  } catch (error) {
    console.error('Image compression error:', error);
    next(error);
  }
};

export default compressImage; 