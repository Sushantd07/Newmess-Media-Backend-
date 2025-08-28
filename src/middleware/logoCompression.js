import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const compressLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // If it's an SVG file, skip compression and proceed
    if (fileExtension === '.svg') {
      console.log('SVG file detected, skipping compression');
      return next();
    }

    // Check if file exists before processing
    if (!fs.existsSync(file.path)) {
      console.error('File does not exist:', file.path);
      return next();
    }

    const originalPath = file.path;
    const filename = path.basename(originalPath, path.extname(originalPath));
    const compressedPath = path.join(path.dirname(originalPath), `${filename}_compressed.jpg`);

    try {
      // Compress image to 300KB for logos
      await sharp(originalPath)
        .resize(400, 400, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
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

      console.log('Logo compressed successfully');
    } catch (sharpError) {
      console.error('Sharp compression error for logo:', originalPath, sharpError);
      // If compression fails, keep the original file
    }

    next();
  } catch (error) {
    console.error('Logo compression error:', error);
    next(error);
  }
};

export default compressLogo;
