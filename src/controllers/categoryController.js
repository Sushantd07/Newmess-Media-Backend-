import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import fs from 'fs';
import path from 'path';

// Create Category
export const createCategory = async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      iconName, 
      icon, 
      order, 
      isActive, 
      featured, 
      metaTitle, 
      metaDescription, 
      keywords,
      color,
      badges 
    } = req.body;
    

    
    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and slug are required' 
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category with this name or slug already exists' 
      });
    }

    // If an icon file path is provided, read the SVG content
    let iconContent = icon;
    if (icon && icon.startsWith('/') && icon.endsWith('.svg')) {
      try {
        // Convert the URL path to a file system path
        const iconPath = path.join(process.cwd(), 'public', icon.replace('/category-icons/', ''));
        
        if (fs.existsSync(iconPath)) {
          iconContent = fs.readFileSync(iconPath, 'utf8');
        }
      } catch (fileError) {
        console.error('Error reading SVG file:', fileError);
        // Continue without the icon if there's an error
      }
    }

    const categoryData = {
      name,
      slug,
      description,
      iconName,
      icon: iconContent,
      order: order || 0,
      subcategoryCount: 0,
      isActive: isActive !== undefined ? isActive : true,
      featured: featured || false,
      metaTitle,
      metaDescription,
      keywords: keywords || [],
      badges: Array.isArray(badges) ? badges : (typeof badges === 'string' && badges.trim() ? badges.split(',').map(s => s.trim()) : [])
    };

    const category = await Category.create(categoryData);



    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (err) {

    res.status(500).json({ 
      success: false, 
      message: 'Error creating category',
      error: err.message 
    });
  }
};

// Bulk Create Categories
export const bulkCreateCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categories array is required' 
      });
    }

    const createdCategories = [];
    const errors = [];

    for (const categoryData of categories) {
      try {
        const { name, slug, description, iconName, icon, order } = categoryData;
        
        if (!name || !slug) {
          errors.push({ name, error: 'Name and slug are required' });
          continue;
        }

        // If an icon file path is provided, read the SVG content
        let iconContent = icon;
        if (icon && icon.startsWith('/') && icon.endsWith('.svg')) {
          try {
            // Convert the URL path to a file system path
            const iconPath = path.join(process.cwd(), 'public', icon.replace('/category-icons/', ''));
            
            if (fs.existsSync(iconPath)) {
              iconContent = fs.readFileSync(iconPath, 'utf8');
            }
          } catch (fileError) {
            console.error('Error reading SVG file:', fileError);
            // Continue without the icon if there's an error
          }
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
          $or: [{ name }, { slug }] 
        });
        
        if (existingCategory) {
          errors.push({ name, error: 'Category already exists' });
          continue;
        }

        const category = await Category.create({
          name,
          slug,
          description,
          iconName,
          icon: iconContent,
          order: order || 0,
          subcategoryCount: 0
        });

        createdCategories.push(category);
      } catch (error) {
        errors.push({ name: categoryData.name, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdCategories.length} categories`,
      data: createdCategories,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating categories',
      error: err.message 
    });
  }
};

// Helper function to convert icon file paths to content - UPDATED FOR PNG SUPPORT
const convertIconPathToContent = async (category) => {
  try {
    if (category.icon && category.icon.startsWith('/')) {
      // Convert the URL path to a file system path
      const iconPath = path.join(process.cwd(), 'public', category.icon.substring(1)); // Remove leading slash
      
      console.log('🔍 Converting icon path:', category.icon);
      console.log('🔍 Full file path:', iconPath);
      console.log('🔍 File exists:', fs.existsSync(iconPath));
      
      if (fs.existsSync(iconPath)) {
        const fileExtension = path.extname(category.icon).toLowerCase();
        
        if (fileExtension === '.svg') {
          // For SVG files, read and return the content
          const svgContent = fs.readFileSync(iconPath, 'utf8');
          console.log('🔍 SVG content length:', svgContent.length);
          return { 
            ...category, 
            icon: svgContent,
            iconType: 'svg'
          };
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(fileExtension)) {
          // CRITICAL: For image files, NEVER read as text - just return the path
          console.log('🔍 IMAGE FILE DETECTED - NOT READING AS TEXT');
          console.log('🔍 File extension:', fileExtension);
          console.log('🔍 Original path:', category.icon);
          console.log('🔍 Returning path without conversion');
          // For image files, return the path and type - NEVER convert to content
          console.log('🔍 Image file detected:', fileExtension);
          console.log('🔍 Keeping original path for image file:', category.icon);
          return { 
            ...category, 
            icon: category.icon, // Keep the path for image files
            iconType: 'image'
          };
        }
      } else {
        console.log('❌ File not found:', iconPath);
      }
    }
  } catch (fileError) {
    console.error('Error reading icon file:', fileError);
  }
  return category;
};

// GET /api/categories → Basic data for /home/category
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

    const updatedCategories = await Promise.all(
      categories.map(async (category) => {
        const count = await Subcategory.countDocuments({ 
          parentCategory: category._id,
          isActive: true 
        });
        
        // Convert icon path to content if needed
        const categoryWithIcon = await convertIconPathToContent(category);
        
        return {
          ...categoryWithIcon,
          subcategoryCount: count,
          badges: categoryWithIcon.badges || []
        };
      })
    );

    res.status(200).json({ 
      success: true, 
      message: 'Categories fetched successfully',
      data: updatedCategories 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories',
      error: err.message 
    });
  }
};

// Get Categories with Subcategories (Efficient for CategoryGrid)
export const getCategoriesWithSubcategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Get subcategories for each category efficiently
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await Subcategory.find({
          parentCategory: category._id,
          isActive: true
        })
        .select('_id id name slug phone logo verified tags address timing order')
        .sort({ order: 1 })
        .lean();

        // Convert icon path to content if needed
        const categoryWithIcon = await convertIconPathToContent(category);

        return {
          _id: categoryWithIcon._id,
          name: categoryWithIcon.name,
          slug: categoryWithIcon.slug,
          icon: categoryWithIcon.icon,
          iconType: categoryWithIcon.iconType,
          badges: categoryWithIcon.badges || [],
          subcategoryCount: subcategories.length,
          subcategories: subcategories
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Categories with subcategories fetched successfully',
      data: categoriesWithSubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories with subcategories',
      error: error.message
    });
  }
};

// Get Category Grid Data (Optimized for frontend)
export const getCategoryGridData = async (req, res) => {
  try {
    // Get top 10 categories with their subcategories
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .limit(10)
      .lean();

    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await Subcategory.find({
          parentCategory: category._id,
          isActive: true
        })
        .select('_id id name slug phone logo verified tags address timing order mainPhone website')
        .sort({ order: 1 })
        .limit(20) // Limit subcategories for performance
        .lean();

        // Convert icon path to content if needed
        const categoryWithIcon = await convertIconPathToContent(category);

        return {
          _id: categoryWithIcon._id,
          name: categoryWithIcon.name,
          slug: categoryWithIcon.slug,
          icon: categoryWithIcon.icon,
          iconType: categoryWithIcon.iconType,
          badges: categoryWithIcon.badges || [],
          subcategoryCount: subcategories.length,
          subcategories: subcategories
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Category grid data fetched successfully',
      data: categoriesWithSubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category grid data',
      error: error.message
    });
  }
};

// Get Category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Convert icon path to content if needed
    const categoryWithIcon = await convertIconPathToContent(category);

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: categoryWithIcon
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category',
      error: err.message 
    });
  }
};

// Get Category by Slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).lean();
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Convert icon path to content if needed
    const categoryWithIcon = await convertIconPathToContent(category);

    res.status(200).json({
      success: true,
      message: 'Category fetched successfully',
      data: categoryWithIcon
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category',
      error: err.message 
    });
  }
};

// Get Company Page Data (Detailed) by Subcategory ID or Slug
export const getCompanyPageData = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    // Find subcategory by ID or slug
    const query = {
      $or: [
        { _id: subcategoryId },
        { id: subcategoryId },
        { slug: subcategoryId }
      ]
    };

    const companyPage = await Subcategory.findOne(query).populate([
      { path: 'parentCategory', select: 'name slug' },
      { path: 'tabs.numbers', model: 'ContactNumbersTab' },
      { path: 'tabs.complaints', model: 'ComplaintsTab' },
      { path: 'tabs.quickhelp', model: 'QuickHelpTab' },
      { path: 'tabs.video', model: 'VideoGuideTab' },
      { path: 'tabs.overview', model: 'OverviewTab' }
    ]);
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    // Determine which tabs are enabled based on actual content
    // Use stored selectedTabs from admin panel if available, otherwise detect dynamically
    let selectedTabs = companyPage.selectedTabs || [];
    
    // If no stored selectedTabs, detect dynamically based on content
    if (selectedTabs.length === 0) {
      if (companyPage.tabs.overview) selectedTabs.push("overview");
      if (companyPage.tabs.numbers) selectedTabs.push("numbers");
      if (companyPage.tabs.complaints) selectedTabs.push("complaints");
      if (companyPage.tabs.quickhelp) selectedTabs.push("quickhelp");
      if (companyPage.tabs.video) selectedTabs.push("video");
    }

    // Add selectedTabs to the response
    const subcategoryDataWithSelectedTabs = {
      ...companyPage.toObject(),
      selectedTabs
    };

    res.status(200).json({
      success: true,
      message: 'Company page data fetched successfully',
      data: subcategoryDataWithSelectedTabs
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching company page data',
      error: err.message 
    });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    // If an icon file path is provided, read the SVG content
    let updateData = { ...req.body };
    if (updateData.badges) {
      updateData.badges = Array.isArray(updateData.badges)
        ? updateData.badges
        : (typeof updateData.badges === 'string' && updateData.badges.trim()
            ? updateData.badges.split(',').map(s => s.trim())
            : []);
    }
    
    if (req.body.icon && req.body.icon.startsWith('/') && req.body.icon.endsWith('.svg')) {
      try {
        // Convert the URL path to a file system path
        const iconPath = path.join(process.cwd(), 'public', req.body.icon.replace('/category-icons/', ''));
        
        if (fs.existsSync(iconPath)) {
          const svgContent = fs.readFileSync(iconPath, 'utf8');
          updateData.icon = svgContent; // Store the actual SVG content
        }
      } catch (fileError) {
        console.error('Error reading SVG file:', fileError);
        // Continue without the icon if there's an error
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating category',
      error: err.message 
    });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Also delete all subcategories under this category
    await Subcategory.deleteMany({ parentCategory: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Category and its subcategories deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting category',
      error: err.message 
    });
  }
};

// Update Category Display Limit
export const updateCategoryDisplayLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayLimit } = req.body;
    
    // Validate display limit
    if (!displayLimit || displayLimit < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Display limit must be a positive number' 
      });
    }

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Update the display limit
    category.displayLimit = displayLimit;
    await category.save();

    res.json({
      success: true,
      message: 'Category display limit updated successfully',
      data: {
        _id: category._id,
        name: category.name,
        displayLimit: category.displayLimit
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating category display limit',
      error: err.message 
    });
  }
};

// Upload Category Icon
export const uploadCategoryIcon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No icon file provided'
      });
    }

    // Debug logging
    console.log('🔍 Icon upload in controller:');
    console.log('🔍 File name:', req.file.originalname);
    console.log('🔍 File mimetype:', req.file.mimetype);
    console.log('🔍 File size:', req.file.size, 'bytes');

    // Validate file type - support multiple image formats
    const allowedMimeTypes = [
      'image/svg+xml',    // SVG
      'image/png',        // PNG
      'image/jpeg',       // JPEG
      'image/jpg',        // JPG
      'image/gif',        // GIF
      'image/webp'        // WebP
    ];
    
    const allowedExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const fileExtension = '.' + req.file.originalname.split('.').pop().toLowerCase();
    
    console.log('🔍 Allowed types:', allowedMimeTypes);
    console.log('🔍 File extension:', fileExtension);
    console.log('🔍 Is type allowed?', allowedMimeTypes.includes(req.file.mimetype));
    console.log('🔍 Is extension allowed?', allowedExtensions.includes(fileExtension));

    if (!allowedMimeTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      console.log('❌ File type validation failed in controller');
      return res.status(400).json({
        success: false,
        message: 'Only SVG, PNG, JPG, JPEG, GIF, and WebP files are allowed for category icons'
      });
    }

    console.log('✅ File type validation passed in controller');

    // Validate file size (200KB limit for icons - optimized for performance)
    if (req.file.size > 200 * 1024) {
      console.log('❌ File size validation failed in controller');
      return res.status(400).json({
        success: false,
        message: 'Icon file size must be less than 200KB for optimal performance'
      });
    }
    
    console.log('✅ File size validation passed in controller');

    // Get category name from request body
    const categoryName = req.body.categoryName || 'category';
    console.log('🔍 Category name for filename:', categoryName);

    // Generate custom filename using category name (no timestamp)
    const customFilename = `${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}${fileExtension}`;
    
    console.log('🔍 Custom filename generated:', customFilename);

    // Rename the uploaded file to use custom filename
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), customFilename);
    
    try {
      // Rename the file
      fs.renameSync(oldPath, newPath);
      console.log('✅ File renamed successfully:', oldPath, '→', newPath);
    } catch (renameError) {
      console.error('❌ Error renaming file:', renameError);
      // If rename fails, use original filename
      const iconPath = `/category-icons/${req.file.filename}`;
      
      res.status(200).json({
        success: true,
        message: 'Category icon uploaded successfully (using original filename)',
        iconPath: iconPath,
        filename: req.file.filename,
        size: req.file.size
      });
      return;
    }

    // Generate the public URL path for the uploaded icon
    const iconPath = `/category-icons/${customFilename}`;

    res.status(200).json({
      success: true,
      message: 'Category icon uploaded successfully with custom filename',
      iconPath: iconPath,
      filename: customFilename,
      size: req.file.size
    });

  } catch (err) {
    console.error('Error uploading category icon:', err);
    res.status(500).json({
      success: false,
      message: 'Error uploading category icon',
      error: err.message
    });
  }
};
