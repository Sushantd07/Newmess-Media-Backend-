import CompanyPage from '../models/CompanyPage.js';
import ContactNumbersTab from '../models/tabs/ContactNumbers.tabs.js';
import ComplaintsTab from '../models/tabs/Complaint.tabs.js';
import QuickHelpTab from '../models/tabs/QuickHelp.tabs.js';
import OverviewTab from '../models/tabs/OverviewTabs.js';
import VideoGuideTab from '../models/tabs/VideoGuide.tabs.js';
import fs from 'fs';
import path from 'path';

// Create Company Page
export const createCompanyPage = async (req, res) => {
  try {
    const companyPage = await CompanyPage.create(req.body);
    res.status(201).json({ success: true, data: companyPage });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Create Company Page with Contact Numbers
export const createCompanyPageWithContactNumbers = async (req, res) => {
  try {
    const { companyData, contactNumbersData } = req.body;
    
    // Step 1: Create contact numbers tab
    const contactNumbersTab = await ContactNumbersTab.create(contactNumbersData);
    
    // Step 2: Create company page with contact numbers tab linked
    const companyPageData = {
      ...companyData,
      tabs: {
        numbers: contactNumbersTab._id,
        complaints: null,
        quickhelp: null,
        video: null,
        overview: null
      },
      // Ensure selectedTabs includes numbers if not already specified
      selectedTabs: companyData.selectedTabs || ["numbers"]
    };
    
    const companyPage = await CompanyPage.create(companyPageData);
    
    // Step 3: Populate the contact numbers data
    await companyPage.populate('tabs.numbers', 'ContactNumbersTab');
    
    res.status(201).json({ 
      success: true, 
      data: companyPage,
      message: 'Company page created with contact numbers successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Create Contact Numbers Tab Only
export const createContactNumbersTab = async (req, res) => {
  try {
    const contactNumbersTab = await ContactNumbersTab.create(req.body);
    res.status(201).json({ 
      success: true, 
      data: contactNumbersTab,
      message: 'Contact numbers tab created successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Add Contact Numbers Tab to Existing Company Page
export const addContactNumbersToCompany = async (req, res) => {
  try {
    const { slug } = req.params;
    const contactNumbersData = req.body;
    
    // Step 1: Find the company page
    const companyPage = await CompanyPage.findOne({ slug });
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }
    
    // Step 2: Create contact numbers tab
    const contactNumbersTab = await ContactNumbersTab.create(contactNumbersData);
    
    // Step 3: Update company page to link the contact numbers tab
    const updatedCompanyPage = await CompanyPage.findByIdAndUpdate(
      companyPage._id,
      {
        tabs: {
          ...companyPage.tabs,
          numbers: contactNumbersTab._id
        },
        // Add contact-numbers to selectedTabs if not already present
        $addToSet: {
          selectedTabs: "numbers"
        }
      },
      { new: true }
    ).populate('tabs.numbers', 'ContactNumbersTab');
    
    res.status(200).json({ 
      success: true, 
      data: updatedCompanyPage,
      message: 'Contact numbers tab added to company page successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get All Company Pages
export const getAllCompanyPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, subCategoryId } = req.query;
    
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (subCategoryId) filter.subCategoryId = subCategoryId;

    const companyPages = await CompanyPage.find(filter)
      .populate('tabs.numbers', 'ContactNumbersTab')
      .populate('tabs.complaints', 'ComplaintsTab')
      .populate('tabs.quickhelp', 'QuickHelpTab')
      .populate('tabs.video', 'VideoGuideTab')
      .populate('tabs.overview', 'OverviewTab')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Add selectedTabs to each company page
    const companyPagesWithSelectedTabs = companyPages.map(companyPage => {
      let selectedTabs = companyPage.selectedTabs || [];
      
      // If no stored selectedTabs, detect dynamically based on content
      if (selectedTabs.length === 0) {
        if (companyPage.tabs.overview) selectedTabs.push("overview");
        if (companyPage.tabs.numbers) selectedTabs.push("numbers");
        if (companyPage.tabs.complaints) selectedTabs.push("complaints");
        if (companyPage.tabs.quickhelp) selectedTabs.push("quickhelp");
        if (companyPage.tabs.video) selectedTabs.push("video");
      }
      
      return {
        ...companyPage.toObject(),
        selectedTabs
      };
    });

    const count = await CompanyPage.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: companyPagesWithSelectedTabs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Lightweight list for admin dropdown – no pagination
export const listAllCompaniesLite = async (req, res) => {
  try {
    const companies = await CompanyPage.find({}, { name: 1, slug: 1, _id: 1 })
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all companies by category slug (unpaginated)
export const listCompaniesByCategorySlug = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    if (!categorySlug) {
      return res.status(400).json({ success: false, message: 'categorySlug is required' });
    }

    // Resolve the Category by slug to handle both slug and ObjectId storage styles
    let categoryIds = [categorySlug];
    try {
      const Category = (await import('../models/Category.js')).default;
      const cat = await Category.findOne({ slug: categorySlug }).lean();
      if (cat?._id) {
        categoryIds.push(String(cat._id));
        categoryIds.push(cat._id); // just in case it was stored as ObjectId
        if (cat.name) categoryIds.push(cat.name); // some datasets use name
      }
    } catch (_) {}

    const companies = await CompanyPage.find({ categoryId: { $in: categoryIds } })
      .select('name slug logo')
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, data: companies });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get Company Page by Slug
export const getCompanyPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const companyPage = await CompanyPage.findOne({ slug })
      .populate('tabs.numbers', 'ContactNumbersTab')
      .populate('tabs.complaints', 'ComplaintsTab')
      .populate('tabs.quickhelp', 'QuickHelpTab')
      .populate('tabs.video', 'VideoGuideTab')
      .populate('tabs.overview', 'OverviewTab');

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
    const companyDataWithSelectedTabs = {
      ...companyPage.toObject(),
      selectedTabs
    };

    res.status(200).json({ success: true, data: companyDataWithSelectedTabs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get Company Page by Category and Subcategory
export const getCompanyPagesByCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    
    const filter = { categoryId };
    if (subCategoryId) filter.subCategoryId = subCategoryId;

    const companyPages = await CompanyPage.find(filter)
      .select('name logo description rating totalReviews slug')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: companyPages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update Company Page
export const updateCompanyPage = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const companyPage = await CompanyPage.findOneAndUpdate(
      { slug },
      req.body,
      { new: true, runValidators: true }
    ).populate('tabs.numbers', 'ContactNumbersTab')
     .populate('tabs.complaints', 'ComplaintsTab')
     .populate('tabs.quickhelp', 'QuickHelpTab')
     .populate('tabs.video', 'VideoGuideTab')
     .populate('tabs.overview', 'OverviewTab');

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
    const companyDataWithSelectedTabs = {
      ...companyPage.toObject(),
      selectedTabs
    };

    res.status(200).json({ success: true, data: companyDataWithSelectedTabs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete Company Page
export const deleteCompanyPage = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const companyPage = await CompanyPage.findOneAndDelete({ slug });

    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Company page deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Search Company Pages
export const searchCompanyPages = async (req, res) => {
  try {
    const { q, categoryId, subCategoryId } = req.query;
    
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (subCategoryId) filter.subCategoryId = subCategoryId;
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } }
      ];
    }

    const companyPages = await CompanyPage.find(filter)
      .select('name logo description rating totalReviews slug categoryId subCategoryId')
      .sort({ rating: -1, name: 1 });

    res.status(200).json({ success: true, data: companyPages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get Company Page with Specific Tab
export const getCompanyPageTab = async (req, res) => {
  try {
    const { slug, tabName } = req.params;
    
    const companyPage = await CompanyPage.findOne({ slug })
      .populate(`tabs.${tabName}`);

    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    const tabData = companyPage.tabs[tabName];
    if (!tabData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tab not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        companyInfo: {
          name: companyPage.name,
          logo: companyPage.logo,
          slug: companyPage.slug
        },
        tabData
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update Contact Numbers Tab
export const updateContactNumbersTab = async (req, res) => {
  try {
    const { slug } = req.params;
    const contactNumbersData = req.body;
    
    // Step 1: Find the company page
    const companyPage = await CompanyPage.findOne({ slug });
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    // Step 2: Check if contact numbers tab exists
    if (!companyPage.tabs.numbers) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact numbers tab not found for this company' 
      });
    }

    // Step 3: Update the contact numbers tab
    const updatedContactNumbers = await ContactNumbersTab.findByIdAndUpdate(
      companyPage.tabs.numbers,
      contactNumbersData,
      { new: true, runValidators: true }
    );

    if (!updatedContactNumbers) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact numbers tab not found' 
      });
    }

    // Step 4: Return the updated company page with populated contact numbers
    const updatedCompanyPage = await CompanyPage.findById(companyPage._id)
      .populate('tabs.numbers', 'ContactNumbersTab')
      .populate('tabs.complaints', 'ComplaintsTab')
      .populate('tabs.quickhelp', 'QuickHelpTab')
      .populate('tabs.video', 'VideoGuideTab')
      .populate('tabs.overview', 'OverviewTab');

    res.status(200).json({ 
      success: true, 
      data: updatedCompanyPage,
      message: 'Contact numbers updated successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Save Dynamic Components
export const saveDynamicComponents = async (req, res) => {
  try {
    const { companySlug, components } = req.body;
    
    if (!companySlug || !components) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company slug and components are required' 
      });
    }

    // Find the company page
    const companyPage = await CompanyPage.findOne({ slug: companySlug });
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    // Update the company page with dynamic components
    companyPage.dynamicComponents = components;
    await companyPage.save();

    res.status(200).json({ 
      success: true, 
      data: companyPage,
      message: 'Dynamic components saved successfully'
    });
  } catch (err) {
    console.error('Error saving dynamic components:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Upload Company Logo
export const uploadCompanyLogo = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No logo file provided' 
      });
    }

    // Find the company page
    const companyPage = await CompanyPage.findOne({ slug });
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    // If company already has a logo, delete the old one from frontend public folder
    if (companyPage.logo && companyPage.logo.url && companyPage.logo.url.startsWith('/')) {
      try {
        const oldLogoPath = path.join('../Frontend/public', companyPage.logo.url);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
          console.log('Old logo deleted from frontend public folder:', oldLogoPath);
        }
      } catch (deleteError) {
        console.error('Error deleting old logo:', deleteError);
      }
    }

    // Generate public URL path for the uploaded logo
    let categoryName = req.body.categoryName || req.body.parentCategoryName || 'general';
    
    // If we got a category ID instead of name, use a default folder
    if (categoryName && categoryName.length > 20) {
      // This looks like an ObjectId, use a default folder
      categoryName = 'general';
    }
    
    const categoryFolder = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = req.file.filename;
    const logoUrl = `/company-logos/${categoryFolder}/${filename}`;
    
    console.log('Logo saved to public folder:', req.file.path);
    console.log('Logo URL generated:', logoUrl);

    // Update company page with new logo information
    const updatedCompanyPage = await CompanyPage.findByIdAndUpdate(
      companyPage._id,
      {
        logo: {
          url: logoUrl,
          filename: filename
        }
      },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      data: {
        logo: {
          url: logoUrl,
          filename: filename
        }
      },
      message: 'Logo uploaded successfully to public folder'
    });
  } catch (err) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete Company Logo
export const deleteCompanyLogo = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find the company page
    const companyPage = await CompanyPage.findOne({ slug });
    
    if (!companyPage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company page not found' 
      });
    }

    // If company has a logo, delete it from frontend public folder
    if (companyPage.logo && companyPage.logo.url && companyPage.logo.url.startsWith('/')) {
      try {
        const logoPath = path.join('../Frontend/public', companyPage.logo.url);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
          console.log('Logo deleted from frontend public folder:', logoPath);
        }
      } catch (deleteError) {
        console.error('Error deleting logo from frontend public folder:', deleteError);
      }
    }

    // Remove logo information from company page
    const updatedCompanyPage = await CompanyPage.findByIdAndUpdate(
      companyPage._id,
      {
        $unset: { logo: 1 }
      },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Logo deleted successfully from frontend public folder'
    });
  } catch (err) {
    console.error('Error deleting logo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};