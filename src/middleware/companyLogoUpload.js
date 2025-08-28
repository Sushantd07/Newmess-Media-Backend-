import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for company logo uploads to frontend public folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get category name from request body (preferred) or fallback to ID
    let categoryName = req.body.categoryName || req.body.parentCategoryName || 'general';
    
    // If we got a category ID instead of name, use a default folder
    if (categoryName && categoryName.length > 20) {
      // This looks like an ObjectId, use a default folder
      categoryName = 'general';
    }
    
    const categoryFolder = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Create path: Frontend/public/company-logos/{category}
    const uploadDir = `../Frontend/public/company-logos/${categoryFolder}`;
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log('📁 Company logo upload directory (Frontend):', uploadDir);
    console.log('📁 Category name used:', categoryName);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get company name from request body for filename
    const companyName = req.body.name || 'company';
    const sanitizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Generate filename: {company-name}.{extension} (no timestamp)
    const filename = `${sanitizedName}${fileExtension}`;
    
    console.log('📄 Company logo filename:', filename);
    cb(null, filename);
  }
});

const companyLogoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file for logo
  },
  fileFilter: (req, file, cb) => {
    // Check file extension
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only SVG, PNG, JPG, JPEG, GIF, and WebP files are allowed for company logos!'), false);
    }
  }
});

export default companyLogoUpload;
