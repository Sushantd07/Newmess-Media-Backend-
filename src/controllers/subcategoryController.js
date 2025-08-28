import Subcategory from '../models/Subcategory.js';
import Category from '../models/Category.js';
import ContactNumbersTab from '../models/tabs/ContactNumbers.tabs.js';
import ComplaintsTab from '../models/tabs/Complaint.tabs.js';
import QuickHelpTab from '../models/tabs/QuickHelp.tabs.js';
import VideoGuideTab from '../models/tabs/VideoGuide.tabs.js';
import {
  incrementCategoryCount,
  decrementCategoryCount,
} from '../middleware/subcategoryMiddleware.js';
import mongoose from 'mongoose';
import OverviewTab from '../models/tabs/OverviewTabs.js';
import { uploadLogoToCloudinary } from '../utils/logoCloudinary.js';

// ✅ Create Subcategory
export const createSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategory,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: err.message,
    });
  }
};

// ✅ Delete Contact Numbers Tab from Company by Slug
export const deleteContactNumbersFromCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find the subcategory by slug or id
    const subcategory = await Subcategory.findOne({
      $or: [
        { slug },
        { id: slug }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const tabId = subcategory.tabs?.numbers;
    if (!tabId) {
      return res.status(404).json({ success: false, message: 'Contact numbers tab not linked' });
    }

    // Delete the tab document
    await ContactNumbersTab.findByIdAndDelete(tabId);

    // Unlink from company and remove selection
    subcategory.tabs.numbers = undefined;
    subcategory.selectedTabs = (subcategory.selectedTabs || []).filter((t) => t !== 'numbers');
    await subcategory.save();

    res.status(200).json({ success: true, message: 'Contact numbers tab deleted and unlinked' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting contact numbers tab', error: err.message });
  }
};

// Create Company Page with Complete Data
export const createCompanyPage = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);
    
    let logoUrl = '/company-logos/Bank/placeholder.svg';
    
    // Handle logo upload if file is present
    if (req.file) {
      console.log('Processing logo file:', req.file.originalname);
      console.log('Logo saved to frontend public folder:', req.file.path);
      
      // Generate public URL path for the uploaded logo
      let categoryName = req.body.categoryName || req.body.parentCategoryName || 'general';
      
      // If we got a category ID instead of name, use a default folder
      if (categoryName && categoryName.length > 20) {
        // This looks like an ObjectId, use a default folder
        categoryName = 'general';
      }
      
      const categoryFolder = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = req.file.filename;
      
      logoUrl = `/company-logos/${categoryFolder}/${filename}`;
      console.log('Logo URL generated (frontend public):', logoUrl);
      console.log('📁 Category folder used:', categoryFolder);
    }

    // Handle logo field from FormData
    let finalLogoUrl = logoUrl; // Default to uploaded logo or placeholder
    
    if (req.body.logo) {
      // If logo is provided in body, use it (but validate it's a proper URL)
      if (typeof req.body.logo === 'string') {
        if (req.body.logo.startsWith('blob:')) {
          // Blob URL from frontend - this means no file was uploaded, use placeholder
          console.log('Blob URL detected in logo field, using placeholder');
          finalLogoUrl = '/company-logos/Bank/placeholder.svg';
        } else if (req.body.logo.startsWith('http') || req.body.logo.startsWith('/')) {
          // Valid URL, use it
          finalLogoUrl = req.body.logo;
        } else {
          // Invalid URL format, use placeholder
          console.log('Invalid logo URL format, using placeholder');
          finalLogoUrl = '/company-logos/Bank/placeholder.svg';
        }
      } else {
        console.log('Unexpected logo format, using placeholder');
        finalLogoUrl = '/company-logos/Bank/placeholder.svg';
      }
    }

    // Parse FormData fields that might be JSON strings or indexed arrays
    let parsedSelectedTabs = [];
    let parsedTags = [];
    
    // Handle indexed array format (selectedTabs[0], selectedTabs[1], etc.)
    const selectedTabsKeys = Object.keys(req.body).filter(key => key.startsWith('selectedTabs['));
    if (selectedTabsKeys.length > 0) {
      // Sort by index to maintain order
      selectedTabsKeys.sort((a, b) => {
        const indexA = parseInt(a.match(/\[(\d+)\]/)[1]);
        const indexB = parseInt(b.match(/\[(\d+)\]/)[1]);
        return indexA - indexB;
      });
      
      parsedSelectedTabs = selectedTabsKeys.map(key => req.body[key]);
      console.log('Parsed selectedTabs from indexed format:', parsedSelectedTabs);
    } else if (req.body.selectedTabs) {
      try {
        console.log('Raw selectedTabs received:', req.body.selectedTabs);
        console.log('Type of selectedTabs:', typeof req.body.selectedTabs);
        
        // Handle both string and array cases
        if (typeof req.body.selectedTabs === 'string') {
          let cleanString = req.body.selectedTabs;
          
          // Handle double-escaped quotes
          if (cleanString.includes('\\"')) {
            cleanString = cleanString.replace(/\\"/g, '"');
          }
          
          // Remove outer quotes if they exist
          if (cleanString.startsWith('"') && cleanString.endsWith('"')) {
            cleanString = cleanString.slice(1, -1);
          }
          
          console.log('Cleaned string:', cleanString);
          
          // Check if it's a JSON string
          if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
            try {
              parsedSelectedTabs = JSON.parse(cleanString);
              console.log('Successfully parsed JSON array:', parsedSelectedTabs);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              // If JSON parsing fails, try to extract values manually
              const matches = cleanString.match(/"([^"]+)"/g);
              if (matches) {
                parsedSelectedTabs = matches.map(match => match.slice(1, -1));
                console.log('Extracted values manually:', parsedSelectedTabs);
              } else {
                parsedSelectedTabs = ["numbers", "overview"];
              }
            }
          } else if (cleanString.includes('"')) {
            // Handle case where the string contains quoted values but isn't a JSON array
            const matches = cleanString.match(/"([^"]+)"/g);
            if (matches) {
              parsedSelectedTabs = matches.map(match => match.slice(1, -1));
              console.log('Extracted quoted values:', parsedSelectedTabs);
            } else {
              parsedSelectedTabs = ["numbers", "overview"];
            }
          } else {
            // Single string value, treat as array with one element
            parsedSelectedTabs = [cleanString];
          }
        } else if (Array.isArray(req.body.selectedTabs)) {
          parsedSelectedTabs = req.body.selectedTabs;
        } else {
          console.warn('Unexpected selectedTabs format:', req.body.selectedTabs);
          parsedSelectedTabs = ["numbers", "overview"];
        }
      } catch (e) {
        console.error('Error parsing selectedTabs:', e);
        console.error('Raw selectedTabs value:', req.body.selectedTabs);
        parsedSelectedTabs = ["numbers", "overview"]; // Use default tabs on error
      }
    } else {
      // No selectedTabs provided, use default
      console.log('No selectedTabs provided, using default tabs');
      parsedSelectedTabs = ["numbers", "overview"];
    }
    
    // Validate that all values are valid enum values
    const validTabValues = ["overview", "numbers", "complaints", "quickhelp", "video"];
    parsedSelectedTabs = parsedSelectedTabs.filter(tab => validTabValues.includes(tab));
    
    if (parsedSelectedTabs.length === 0) {
      console.log('No valid tab values found, using default tabs');
      parsedSelectedTabs = ["numbers", "overview"];
    }
    
    // Final safety check - ensure we have a proper array
    if (!Array.isArray(parsedSelectedTabs)) {
      console.warn('parsedSelectedTabs is not an array, converting to array');
      parsedSelectedTabs = ["numbers", "overview"];
    }
    
    // Ensure all elements are strings
    parsedSelectedTabs = parsedSelectedTabs.map(tab => String(tab));
    
    console.log('Final processed selectedTabs:', parsedSelectedTabs);
    
    // Handle indexed array format for tags (tags[0], tags[1], etc.)
    const tagsKeys = Object.keys(req.body).filter(key => key.startsWith('tags['));
    if (tagsKeys.length > 0) {
      // Sort by index to maintain order
      tagsKeys.sort((a, b) => {
        const indexA = parseInt(a.match(/\[(\d+)\]/)[1]);
        const indexB = parseInt(b.match(/\[(\d+)\]/)[1]);
        return indexA - indexB;
      });
      
      parsedTags = tagsKeys.map(key => req.body[key]);
      console.log('Parsed tags from indexed format:', parsedTags);
    } else if (req.body.tags) {
      try {
        // Handle both string and array cases
        if (typeof req.body.tags === 'string') {
          // Clean up the string - remove extra escaping
          let cleanString = req.body.tags;
          
          // Handle double-escaped quotes
          if (cleanString.includes('\\"')) {
            cleanString = cleanString.replace(/\\"/g, '"');
          }
          
          // Remove outer quotes if they exist
          if (cleanString.startsWith('"') && cleanString.endsWith('"')) {
            cleanString = cleanString.slice(1, -1);
          }
          
          // Check if it's a JSON string
          if (cleanString.startsWith('[') && cleanString.endsWith(']')) {
            parsedTags = JSON.parse(cleanString);
          } else {
            // Single string value, treat as array with one element
            parsedTags = [cleanString];
          }
        } else if (Array.isArray(req.body.tags)) {
          parsedTags = req.body.tags;
        } else {
          console.warn('Unexpected tags format:', req.body.tags);
          parsedTags = [];
        }
        
        console.log('Parsed tags:', parsedTags);
      } catch (e) {
        console.error('Error parsing tags:', e);
        console.error('Raw tags value:', req.body.tags);
        parsedTags = [];
      }
    }

    // Parse other FormData fields that might be strings
    const parsedVerified = req.body.verified === 'true' || req.body.verified === true;
    const parsedIsActive = req.body.isActive === 'true' || req.body.isActive === true;
    const parsedOrder = req.body.order ? parseInt(req.body.order, 10) : 0;
    const parsedRating = req.body.rating ? parseFloat(req.body.rating) : 0;
    const parsedTotalReviews = req.body.totalReviews ? parseInt(req.body.totalReviews, 10) : 0;
    const parsedMonthlySearches = req.body.monthlySearches || '0';

    const {
      // Home page data
      id,
      name,
      slug,
      phone,
      logo = finalLogoUrl,
      verified = parsedVerified,
      isActive = parsedIsActive,
      tags = parsedTags,
      address = req.body.address || 'All India',
      timing = req.body.timing || 'Mon - Sat, 9 AM - 5 PM',
      parentCategory,
      order = parsedOrder,
      role = req.body.role || 'Support', // New role field for dynamic label
      
      // Company page data
      description = req.body.description || '',
      companyName = req.body.companyName || '',
      mainPhone = req.body.mainPhone || '',
      website = req.body.website || '',
      founded = req.body.founded || '',
      headquarters = req.body.headquarters || '',
      parentCompany = req.body.parentCompany || '',
      rating = parsedRating,
      totalReviews = parsedTotalReviews,
      monthlySearches = parsedMonthlySearches,
      
      // Contact tab data (if you want to link existing contact data)
      contactTabId = req.body.contactTabId || null,
      
      // Tab selection data
      selectedTabs = parsedSelectedTabs
    } = req.body;

    // Debug logging for parsed values
    console.log('Parsed values:', {
      selectedTabs: parsedSelectedTabs,
      tags: parsedTags,
      verified: parsedVerified,
      isActive: parsedIsActive,
      order: parsedOrder,
      rating: parsedRating,
      totalReviews: parsedTotalReviews,
      monthlySearches: parsedMonthlySearches
    });

    // Validate selectedTabs enum values (already validated above)
    if (parsedSelectedTabs.length > 0) {
      console.log('Selected tabs validation passed:', parsedSelectedTabs);
    }

    // Validate required fields
    if (!id || !name || !slug || !phone || !parentCategory) {
      console.log('Missing required fields:', { id, name, slug, phone, parentCategory });
      return res.status(400).json({
        success: false,
        message: `Required fields missing: ${!id ? 'id ' : ''}${!name ? 'name ' : ''}${!slug ? 'slug ' : ''}${!phone ? 'phone ' : ''}${!parentCategory ? 'parentCategory' : ''}`
      });
    }

    // Check if subcategory already exists
    const existingSubcategory = await Subcategory.findOne({
      $or: [{ id }, { slug }]
    });

    if (existingSubcategory) {
      return res.status(409).json({
        success: false,
        message: 'Subcategory with this ID or slug already exists'
      });
    }

    // Create tabs based on selectedTabs
    let contactNumbersTabId = contactTabId;
    let overviewTabId = null;
    let complaintsTabId = null;
    let quickhelpTabId = null;
    let videoTabId = null;

    try {

      // Create Contact Numbers Tab if selected (empty skeleton, no hardcoded data)
      if (selectedTabs.includes('numbers') && !contactTabId) {
        const emptyContactNumbersData = {
          tabTitle: "Contact Numbers",
          tabDescription: `Contact information for ${name}`
          // Intentionally leaving all sections empty; admin will fill via panel
        };

        const contactNumbersTab = await ContactNumbersTab.create(emptyContactNumbersData);
        contactNumbersTabId = contactNumbersTab._id;
        console.log('✅ Contact Numbers Tab created:', contactNumbersTabId);
      }

      // Create Overview Tab if selected
      if (selectedTabs.includes('overview')) {
        const defaultOverviewData = {
          heading: { key: 'overview', text: 'Company Overview', subText: `About ${name}` },
          about: {
            title: name,
            description: description || `Welcome to ${name}. We are committed to providing excellent service and support to our customers.`
          },
          meta: [
            { label: 'Founded', value: founded || 'N/A' },
            { label: 'Headquarters', value: headquarters || 'N/A' },
            { label: 'Parent Company', value: parentCompany || 'N/A' },
            { label: 'Rating', value: rating ? `${rating}/5` : 'N/A' },
            { label: 'Website', value: website || 'N/A' },
            { label: 'Main Phone', value: mainPhone || phone || 'N/A' }
          ],
          services: ['Customer Support', '24x7 Helpline', 'Online Services'],
          quickLinks: [
            { title: 'Contact Us', href: '#contact', icon: 'phone' },
            { title: 'Customer Care', href: '#support', icon: 'help-circle' },
            { title: 'Website', href: website || '#', icon: 'globe' }
          ],
          faqs: [
            {
              question: 'How can I contact customer support?',
              answer: `You can reach our customer support team at ${phone} or ${mainPhone || phone} for 24x7 assistance.`
            },
            {
              question: 'What are your business hours?',
              answer: 'Our customer support is available 24x7. For specific services, please check individual department timings.'
            }
          ]
        };

        const overviewTab = await OverviewTab.create(defaultOverviewData);
        overviewTabId = overviewTab._id;
        console.log('✅ Overview Tab created:', overviewTabId);
      }

      // Create Complaints Tab if selected
      if (selectedTabs.includes('complaints')) {
        const defaultComplaintsData = {
          tabTitle: "Complaint Process",
          tabDescription: `How to register and resolve complaints with ${name}`,
          heading: { key: 'complaints', text: 'Complaint Registration & Resolution', subText: 'Step-by-step process' },
          process: [
            {
              step: 1,
              title: 'Contact Customer Care',
              description: `Call our customer care at ${phone} to register your complaint`,
              icon: 'phone'
            },
            {
              step: 2,
              title: 'Provide Details',
              description: 'Share your account details and describe the issue clearly',
              icon: 'file-text'
            },
            {
              step: 3,
              title: 'Get Reference Number',
              description: 'You will receive a complaint reference number for tracking',
              icon: 'hash'
            },
            {
              step: 4,
              title: 'Resolution Timeline',
              description: 'Most complaints are resolved within 24-48 hours',
              icon: 'clock'
            }
          ]
        };

        const complaintsTab = await ComplaintsTab.create(defaultComplaintsData);
        complaintsTabId = complaintsTab._id;
        console.log('✅ Complaints Tab created:', complaintsTabId);
      }

      // Create Quick Help Tab if selected
      if (selectedTabs.includes('quickhelp')) {
        const defaultQuickHelpData = {
          tabTitle: "Quick Help",
          tabDescription: `Quick solutions and FAQs for ${name}`,
          heading: { key: 'quickhelp', text: 'Quick Help & FAQs', subText: 'Common questions and solutions' },
          faqs: [
            {
              question: 'How can I contact customer support?',
              answer: `Call us at ${phone} for immediate assistance.`
            },
            {
              question: 'What are your business hours?',
              answer: 'Our customer support is available 24x7.'
            },
            {
              question: 'How can I track my complaint?',
              answer: 'Use the reference number provided when you registered your complaint.'
            }
          ]
        };

        const quickhelpTab = await QuickHelpTab.create(defaultQuickHelpData);
        quickhelpTabId = quickhelpTab._id;
        console.log('✅ Quick Help Tab created:', quickhelpTabId);
      }

      // Create Video Guide Tab if selected
      if (selectedTabs.includes('video')) {
        const defaultVideoData = {
          tabTitle: "Video Guide",
          tabDescription: `Video tutorials and guides for ${name}`,
          heading: { key: 'video', text: 'Video Tutorials & Guides', subText: 'Learn how to use our services' },
          videos: [
            {
              title: 'Getting Started',
              description: 'Introduction to our services and how to get help',
              videoUrl: 'https://example.com/intro-video',
              thumbnail: 'https://example.com/thumbnail1.jpg'
            },
            {
              title: 'Contacting Support',
              description: 'Step-by-step guide to contact customer support',
              videoUrl: 'https://example.com/support-video',
              thumbnail: 'https://example.com/thumbnail2.jpg'
            }
          ]
        };

        const videoTab = await VideoGuideTab.create(defaultVideoData);
        videoTabId = videoTab._id;
        console.log('✅ Video Guide Tab created:', videoTabId);
      }

    } catch (tabError) {
      console.error('❌ Error creating tabs:', tabError);
      // Continue with company creation even if tab creation fails
    }

    // Create the company page with all data and linked tabs
    const companyPageData = {
      // Home page fields
      id,
      name,
      slug,
      phone,
      logo,
      verified,
      isActive,
      tags,
      address,
      timing,
      parentCategory,
      order,
      role, // Add role field
      
      // Company page fields
      description,
      companyName: companyName || name,
      mainPhone: mainPhone || phone,
      website,
      founded,
      headquarters,
      parentCompany,
      rating,
      totalReviews,
      monthlySearches,
      
      // Link to created tabs (only include tabs that were actually created)
      tabs: (() => {
        const tabs = {};
        if (contactNumbersTabId) tabs.numbers = contactNumbersTabId;
        if (overviewTabId) tabs.overview = overviewTabId;
        if (complaintsTabId) tabs.complaints = complaintsTabId;
        if (quickhelpTabId) tabs.quickhelp = quickhelpTabId;
        if (videoTabId) tabs.video = videoTabId;
        return tabs;
      })(),
      
      // Store only the selected tabs from admin panel
      selectedTabs: selectedTabs || []
    };

    const newCompanyPage = await Subcategory.create(companyPageData);

    // Populate the tabs data for response (only populate tabs that exist)
    const populatePaths = [];
    if (contactNumbersTabId) populatePaths.push({ path: 'tabs.numbers', model: 'ContactNumbersTab' });
    if (overviewTabId) populatePaths.push({ path: 'tabs.overview', model: 'OverviewTab' });
    if (complaintsTabId) populatePaths.push({ path: 'tabs.complaints', model: 'ComplaintsTab' });
    if (quickhelpTabId) populatePaths.push({ path: 'tabs.quickhelp', model: 'QuickHelpTab' });
    if (videoTabId) populatePaths.push({ path: 'tabs.video', model: 'VideoGuideTab' });
    
    if (populatePaths.length > 0) {
      await newCompanyPage.populate(populatePaths);
    }

    res.status(201).json({
      success: true,
      message: 'Company page created successfully with default tabs',
      data: {
        companyPage: newCompanyPage,
        homePageData: {
          id: newCompanyPage.id,
          name: newCompanyPage.name,
          phone: newCompanyPage.phone,
          logo: newCompanyPage.logo,
          timing: newCompanyPage.timing
        },
        companyPageData: {
          description: newCompanyPage.description,
          companyName: newCompanyPage.companyName,
          website: newCompanyPage.website,
          rating: newCompanyPage.rating
        },
        createdTabs: (() => {
          const created = {};
          if (contactNumbersTabId) created.contactNumbers = contactNumbersTabId;
          if (overviewTabId) created.overview = overviewTabId;
          if (complaintsTabId) created.complaints = complaintsTabId;
          if (quickhelpTabId) created.quickhelp = quickhelpTabId;
          if (videoTabId) created.video = videoTabId;
          return created;
        })()
      }
    });

  } catch (err) {
    console.error('❌ Error creating company page:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating company page',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Link Existing Contact Tab to Company Page
export const linkContactTabToCompany = async (req, res) => {
  try {
    const { subcategoryId, contactTabId } = req.body;

    if (!subcategoryId || !contactTabId) {
      return res.status(400).json({
        success: false,
        message: 'subcategoryId and contactTabId are required'
      });
    }

    // Find the subcategory
    const subcategory = await Subcategory.findOne({
      $or: [
        { _id: subcategoryId },
        { id: subcategoryId },
        { slug: subcategoryId }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Link the contact tab
    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      subcategory._id,
      { 'tabs.numbers': contactTabId },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Contact tab linked successfully',
      data: {
        subcategoryId: updatedSubcategory._id,
        contactTabId: contactTabId,
        companyName: updatedSubcategory.name
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error linking contact tab',
      error: err.message
    });
  }
};

// Get Company Page Data (for frontend)
export const getCompanyPageData = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Build query based on whether companyId looks like an ObjectId
    let query;
    if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      query = { _id: companyId };
    } else {
      // It's a slug or id string
      query = {
        $or: [
          { id: companyId },
          { slug: companyId }
        ]
      };
    }

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
    // But only if we don't have selectedTabs from admin panel
    if (selectedTabs.length === 0) {
      // Only check for tabs that actually exist in the database
      if (companyPage.tabs.overview && companyPage.tabs.overview !== null) selectedTabs.push("overview");
      if (companyPage.tabs.numbers && companyPage.tabs.numbers !== null) selectedTabs.push("numbers");
      if (companyPage.tabs.complaints && companyPage.tabs.complaints !== null) selectedTabs.push("complaints");
      if (companyPage.tabs.quickhelp && companyPage.tabs.quickhelp !== null) selectedTabs.push("quickhelp");
      if (companyPage.tabs.video && companyPage.tabs.video !== null) selectedTabs.push("video");
    }

    // Add selectedTabs to the response
    const companyDataWithSelectedTabs = {
      ...companyPage.toObject(),
      selectedTabs
    };

    res.status(200).json({
      success: true,
      message: 'Company page data fetched successfully',
      data: companyDataWithSelectedTabs
    });

  } catch (err) {
    console.error('Error in getCompanyPageData:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching company page data',
      error: err.message
    });
  }
};

// Bulk Create Subcategories
export const bulkCreateSubcategories = async (req, res) => {
  try {
    const { subcategories } = req.body;

    if (!subcategories || !Array.isArray(subcategories)) {
      return res.status(400).json({
        success: false,
        message: 'Subcategories array is required'
      });
    }

    const createdSubcategories = [];
    const errors = [];

    for (const subcategoryData of subcategories) {
      try {
        const {
          name,
          slug,
          number,
          id,
          phone,
          parentCategory,
          logo,
          tags,
          address,
          timing,
          website,
          rating,
          ratingCount,
          verified,
          serviceType,
          fullForm,
          available24x7,
          verifiedDate,
          order
        } = subcategoryData;

        if (!name || !slug || !number || !id || !phone || !parentCategory) {
          errors.push({ name, error: 'Required fields missing' });
          continue;
        }

        // Check if subcategory already exists
        const existingSubcategory = await Subcategory.findOne({
          $or: [{ slug }, { id }]
        });

        if (existingSubcategory) {
          errors.push({ name, error: 'Subcategory already exists' });
          continue;
        }

        // Verify parent category exists
        const parentCategoryExists = await Category.findById(parentCategory);
        if (!parentCategoryExists) {
          errors.push({ name, error: 'Parent category not found' });
          continue;
        }

        const subcategory = await Subcategory.create({
          name,
          slug,
          number,
          id,
          phone,
          parentCategory,
          logo: logo || '',
          tags: tags || [],
          address: address || 'All India',
          timing: timing || 'Mon - Sat, 9 AM - 5 PM',
          website: website || '#',
          rating: rating || 5,
          ratingCount: ratingCount || 1,
          verified: verified !== undefined ? verified : true,
          serviceType,
          fullForm,
          available24x7: available24x7 !== undefined ? available24x7 : true,
          verifiedDate,
          order: order || 0
        });

        await incrementCategoryCount(subcategory);
        createdSubcategories.push(subcategory);
      } catch (error) {
        errors.push({ name: subcategoryData.name, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdSubcategories.length} subcategories`,
      data: createdSubcategories,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating subcategories',
      error: err.message
    });
  }
};

// Bulk Create Subcategories by Category ID
export const bulkCreateSubcategoriesByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subcategories } = req.body;

    if (!subcategories || !Array.isArray(subcategories)) {
      return res.status(400).json({
        success: false,
        message: 'Subcategories array is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Find category by ObjectId
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category with ID '${categoryId}' not found`
      });
    }

    const createdSubcategories = [];
    const errors = [];

    for (const subcategoryData of subcategories) {
      try {
        const {
          id,
          name,
          slug,
          phone,
          logo,
          tags,
          address,
          timing,
          verified,
          order
        } = subcategoryData;

        // Validate required fields
        if (!id || !name || !slug || !phone) {
          errors.push({ name, error: 'id, name, slug, and phone are required' });
          continue;
        }

        // Check if subcategory already exists
        const existingSubcategory = await Subcategory.findOne({
          $or: [{ id }, { slug }]
        });

        if (existingSubcategory) {
          errors.push({ name, error: 'Subcategory with this id or slug already exists' });
          continue;
        }

        const subcategory = await Subcategory.create({
          id,
          name,
          slug,
          phone,
          parentCategory: category._id, // Use category ObjectId from URL
          logo: logo || '',
          tags: tags || [],
          address: address || 'All India',
          timing: timing || 'Mon - Sat, 9 AM - 5 PM',
          verified: verified !== undefined ? verified : true,
          order: order || 0
        });

        createdSubcategories.push(subcategory);
      } catch (error) {
        errors.push({ name: subcategoryData.name, error: error.message });
      }
    }

    // Update category count
    if (createdSubcategories.length > 0) {
      const newCount = category.subcategoryCount + createdSubcategories.length;
      await Category.findByIdAndUpdate(category._id, { subcategoryCount: newCount });
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdSubcategories.length} subcategories for category '${category.name}'`,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        },
        subcategories: createdSubcategories,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subcategories by category ID',
      error: error.message
    });
  }
};

// ✅ Get All Subcategories
export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({ isActive: true })
      .populate('parentCategory', 'name slug')
      .sort({ order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Subcategories fetched successfully',
      data: subcategories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: err.message
    });
  }
};

// ✅ Get Subcategories by Category ID
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      parentCategory: req.params.categoryId,
      isActive: true
    })
      .populate('parentCategory', 'name slug')
      .sort({ order: 1 })
      .lean();

    res.status(200).json({
      success: true,
      message: 'Subcategories fetched successfully',
      data: subcategories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: err.message
    });
  }
};

// Get Subcategory by ID
export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id)
      .populate('parentCategory', 'name slug');

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Subcategory fetched successfully',
      data: subcategory
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory',
      error: err.message
    });
  }
};

// Update Subcategory
export const updateSubcategory = async (req, res) => {
  try {
    const updateData = req.body;
    
    console.log('updateSubcategory called with data:', JSON.stringify(updateData, null, 2));
    
    // Prepare update object
    const updateObject = { ...updateData };
    
    // Handle tabs updates if provided - merge instead of overwrite
    if (updateData.tabs) {
      console.log('Tabs update detected:', updateData.tabs);
      
      // Get current subcategory to merge tabs
      const currentSubcategory = await Subcategory.findById(req.params.id);
      if (currentSubcategory) {
        console.log('Current subcategory tabs:', currentSubcategory.tabs);
        
        updateObject.tabs = {
          ...currentSubcategory.tabs,
          ...updateData.tabs
        };
        
        console.log('Merged tabs object:', updateObject.tabs);
      }
    }

    console.log('Final update object:', JSON.stringify(updateObject, null, 2));

    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      updateObject,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug');

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    console.log('Updated subcategory tabs:', subcategory.tabs);

    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subcategory
    });
  } catch (err) {
    console.error('Error in updateSubcategory:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
      error: err.message
    });
  }
};

// Update Company Page Data
export const updateCompanyPage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build query based on whether id looks like an ObjectId
    let query;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      query = { _id: id };
    } else {
      // It's a slug or id string
      query = {
        $or: [
          { id: id },
          { slug: id }
        ]
      };
    }

    // Find the subcategory
    const subcategory = await Subcategory.findOne(query);
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Prepare update object
    const updateObject = {
      $set: {
        name: updateData.name,
        description: updateData.description,
        founded: updateData.founded,
        headquarters: updateData.headquarters,
        rating: updateData.rating,
        website: updateData.website,
        phone: updateData.phone,
        complaintContent: updateData.complaintContent,
      }
    };

    // Handle selectedTabs if provided
    if (updateData.selectedTabs) {
      updateObject.$set.selectedTabs = updateData.selectedTabs;
      
      // Create missing tabs if they don't exist
      const existingTabs = subcategory.tabs || {};
      const newTabs = {};
      let hasNewTabs = false;
      
      try {
        // Create missing tabs based on selectedTabs
        for (const tabType of updateData.selectedTabs) {
          if (!existingTabs[tabType]) {
            hasNewTabs = true;
            
            switch (tabType) {
              case 'numbers':
                if (!existingTabs.numbers) {
                  const defaultContactNumbersData = {
                    tabTitle: "Contact Numbers",
                    tabDescription: `Contact information for ${updateData.name || subcategory.name}`,
                    topContactCards: {
                      heading: { key: 'topContactCards', text: 'Top Contact Cards', subText: 'Main contact numbers' },
                      cards: [
                        {
                          title: 'Customer Care',
                          number: updateData.phone || subcategory.phone,
                          subtitle: '24x7 Support',
                          icon: 'phone',
                          colors: { cardBg: '#3B82F6', iconBg: '#1E40AF', textColor: '#FFFFFF' }
                        }
                      ]
                    }
                  };
                  const contactNumbersTab = await ContactNumbersTab.create(defaultContactNumbersData);
                  newTabs.numbers = contactNumbersTab._id;
                }
                break;
                
              case 'overview':
                if (!existingTabs.overview) {
                  const defaultOverviewData = {
                    heading: { key: 'overview', text: 'Company Overview', subText: `About ${updateData.name || subcategory.name}` },
                    about: {
                      title: updateData.name || subcategory.name,
                      description: updateData.description || subcategory.description || `Welcome to ${updateData.name || subcategory.name}.`
                    },
                    meta: [
                      { label: 'Founded', value: updateData.founded || 'N/A' },
                      { label: 'Headquarters', value: updateData.headquarters || 'N/A' },
                      { label: 'Website', value: updateData.website || 'N/A' },
                      { label: 'Phone', value: updateData.phone || subcategory.phone || 'N/A' }
                    ]
                  };
                  const overviewTab = await OverviewTab.create(defaultOverviewData);
                  newTabs.overview = overviewTab._id;
                }
                break;
                
              case 'complaints':
                if (!existingTabs.complaints) {
                  const defaultComplaintsData = {
                    tabTitle: "Complaint Process",
                    tabDescription: `How to register and resolve complaints with ${updateData.name || subcategory.name}`,
                    heading: { key: 'complaints', text: 'Complaint Registration & Resolution', subText: 'Step-by-step process' },
                    process: [
                      {
                        step: 1,
                        title: 'Contact Customer Care',
                        description: `Call our customer care at ${updateData.phone || subcategory.phone} to register your complaint`,
                        icon: 'phone'
                      }
                    ]
                  };
                  const complaintsTab = await ComplaintsTab.create(defaultComplaintsData);
                  newTabs.complaints = complaintsTab._id;
                }
                break;
                
              case 'quickhelp':
                if (!existingTabs.quickhelp) {
                  const defaultQuickHelpData = {
                    tabTitle: "Quick Help",
                    tabDescription: `Quick solutions and FAQs for ${updateData.name || subcategory.name}`,
                    heading: { key: 'quickhelp', text: 'Quick Help & FAQs', subText: 'Common questions and solutions' },
                    faqs: [
                      {
                        question: 'How can I contact customer support?',
                        answer: `Call us at ${updateData.phone || subcategory.phone} for immediate assistance.`
                      }
                    ]
                  };
                  const quickhelpTab = await QuickHelpTab.create(defaultQuickHelpData);
                  newTabs.quickhelp = quickhelpTab._id;
                }
                break;
                
              case 'video':
                if (!existingTabs.video) {
                  const defaultVideoData = {
                    tabTitle: "Video Guide",
                    tabDescription: `Video tutorials and guides for ${updateData.name || subcategory.name}`,
                    heading: { key: 'video', text: 'Video Tutorials & Guides', subText: 'Learn how to use our services' },
                    videos: [
                      {
                        title: 'Getting Started',
                        description: 'Introduction to our services and how to get help',
                        videoUrl: 'https://example.com/intro-video',
                        thumbnail: 'https://example.com/thumbnail1.jpg'
                      }
                    ]
                  };
                  const videoTab = await VideoGuideTab.create(defaultVideoData);
                  newTabs.video = videoTab._id;
                }
                break;
            }
          }
        }
        
        // Update tabs object with new tabs
        if (hasNewTabs) {
          updateObject.$set.tabs = {
            ...existingTabs,
            ...newTabs
          };
        }
        
      } catch (tabError) {
        console.error('❌ Error creating missing tabs:', tabError);
        // Continue with update even if tab creation fails
      }
    }

    // Handle tabs updates if provided
    if (updateData.tabs) {
      updateObject.$set.tabs = {
        ...subcategory.tabs,
        ...updateData.tabs
      };
    }

    // Update the subcategory with new data
    const updatedSubcategory = await Subcategory.findOneAndUpdate(
      query,
      updateObject,
      { new: true, runValidators: true }
    );

    // Populate the tabs data for response
    await updatedSubcategory.populate([
      { path: 'tabs.numbers', model: 'ContactNumbersTab' },
      { path: 'tabs.overview', model: 'OverviewTab' },
      { path: 'tabs.complaints', model: 'ComplaintsTab' },
      { path: 'tabs.quickhelp', model: 'QuickHelpTab' },
      { path: 'tabs.video', model: 'VideoGuideTab' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Company page updated successfully',
      data: updatedSubcategory,
      createdTabs: hasNewTabs ? Object.keys(newTabs) : []
    });

  } catch (error) {
    console.error('Error updating company page:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company page',
      error: error.message
    });
  }
};

// ✅ Delete Subcategory (with count update)
export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    await decrementCategoryCount(subcategory); // Update count
    res.status(200).json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory',
      error: err.message
    });
  }
};

// Create Contact Numbers Data and Auto-Link to Subcategory
export const createContactNumbersData = async (req, res) => {
  try {
    const {
      subcategoryId, // ID of the subcategory to link to
      tabTitle,
      tabDescription,
      topContactCards,
      nationalNumbersSection,
      helplineNumbersSection,
      allIndiaNumbersSection,
      stateWiseNumbersSection,
      smsServicesSection,
      ivrMenuSection,
      quickLinksSection,
      emailSupportSection,
      customerCareListSection
    } = req.body;

    // Validate required fields
    if (!subcategoryId || !tabTitle) {
      return res.status(400).json({
        success: false,
        message: 'subcategoryId and tabTitle are required'
      });
    }

    // Find the subcategory first
    const subcategory = await Subcategory.findOne({
      $or: [
        { _id: subcategoryId },
        { id: subcategoryId },
        { slug: subcategoryId }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Create the ContactNumbers document
    const contactNumbersData = {
      tabTitle,
      tabDescription,
      topContactCards,
      nationalNumbersSection,
      helplineNumbersSection,
      allIndiaNumbersSection,
      stateWiseNumbersSection,
      smsServicesSection,
      ivrMenuSection,
      quickLinksSection,
      emailSupportSection,
      customerCareListSection
    };

    const contactNumbers = await ContactNumbersTab.create(contactNumbersData);

    // Auto-link the contact numbers to the subcategory
    subcategory.tabs.numbers = contactNumbers._id;
    await subcategory.save();

    res.status(201).json({
      success: true,
      message: 'Contact numbers data created and linked successfully',
      data: {
        contactNumbersId: contactNumbers._id,
        subcategoryId: subcategory._id,
        subcategoryName: subcategory.name,
        tabTitle: contactNumbers.tabTitle
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating contact numbers data',
      error: err.message
    });
  }
};

// Add Contact Numbers Tab to Company by Slug (Single Step)
export const addContactNumbersToCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const contactNumbersData = req.body;

    // Validate required fields
    if (!contactNumbersData.tabTitle) {
      return res.status(400).json({
        success: false,
        message: 'tabTitle is required'
      });
    }

    // Find the subcategory by slug
    const subcategory = await Subcategory.findOne({
      $or: [
        { slug: slug },
        { id: slug }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Create the ContactNumbers document
    const contactNumbers = await ContactNumbersTab.create(contactNumbersData);

    // Auto-link the contact numbers to the subcategory
    subcategory.tabs.numbers = contactNumbers._id;
    await subcategory.save();

    // Populate the contact numbers data
    await subcategory.populate('tabs.numbers', 'ContactNumbersTab');

    res.status(201).json({
      success: true,
      message: 'Contact numbers tab added to company successfully',
      data: {
        companyName: subcategory.name,
        companySlug: subcategory.slug,
        contactNumbersId: contactNumbers._id,
        tabTitle: contactNumbers.tabTitle,
        fullCompanyData: subcategory
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error adding contact numbers to company',
      error: err.message
    });
  }
};

// ✅ Add Complaints Tab to Company by Slug
export const addComplaintsToCompanyBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const complaintsData = req.body;

    // Validate required fields
    if (!complaintsData.tabTitle) {
      return res.status(400).json({
        success: false,
        message: 'tabTitle is required'
      });
    }

    // Find the subcategory by slug
    const subcategory = await Subcategory.findOne({
      $or: [
        { slug: slug },
        { id: slug }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Create the ComplaintsTab document
    const complaintsTab = await ComplaintsTab.create(complaintsData);

    // Auto-link the complaints tab to the subcategory
    subcategory.tabs.complaints = complaintsTab._id;
    await subcategory.save();

    // Populate the complaints data
    await subcategory.populate('tabs.complaints', 'ComplaintsTab');

    res.status(201).json({
      success: true,
      message: 'Complaints tab added to company successfully',
      data: {
        companyName: subcategory.name,
        companySlug: subcategory.slug,
        complaintsTabId: complaintsTab._id,
        tabTitle: complaintsTab.tabTitle,
        fullCompanyData: subcategory
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error adding complaints tab to company',
      error: err.message
    });
  }
};

// Create Default Tabs for Existing Company
export const createDefaultTabsForCompany = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find the company page
    const companyPage = await Subcategory.findOne({ slug });
    
    if (!companyPage) {
      return res.status(404).json({
        success: false,
        message: 'Company page not found'
      });
    }

    let createdTabs = {};
    let updatedTabs = { ...companyPage.tabs };

    // Create Contact Numbers Tab if it doesn't exist (empty by default)
    if (!companyPage.tabs.numbers) {
      const contactNumbersTab = await ContactNumbersTab.create({
        tabTitle: "Contact Numbers",
        tabDescription: `Contact information for ${companyPage.name}`
      });
      updatedTabs.numbers = contactNumbersTab._id;
      createdTabs.contactNumbers = contactNumbersTab._id;
      console.log('✅ Default Contact Numbers Tab created for existing company:', contactNumbersTab._id);
    }

    // Create default Overview Tab if it doesn't exist
    if (!companyPage.tabs.overview) {
      const defaultOverviewData = {
        heading: { key: 'overview', text: 'Company Overview', subText: `About ${companyPage.name}` },
        about: {
          title: companyPage.name,
          description: companyPage.description || `Welcome to ${companyPage.name}. We are committed to providing excellent service and support to our customers.`
        },
        meta: [
          { label: 'Founded', value: companyPage.founded || 'N/A' },
          { label: 'Headquarters', value: companyPage.headquarters || 'N/A' },
          { label: 'Parent Company', value: companyPage.parentCompany || 'N/A' },
          { label: 'Rating', value: companyPage.rating ? `${companyPage.rating}/5` : 'N/A' },
          { label: 'Website', value: companyPage.website || 'N/A' },
          { label: 'Main Phone', value: companyPage.mainPhone || companyPage.phone || 'N/A' }
        ],
        services: ['Customer Support', '24x7 Helpline', 'Online Services'],
        quickLinks: [
          { title: 'Contact Us', href: '#contact', icon: 'phone' },
          { title: 'Customer Care', href: '#support', icon: 'help-circle' },
          { title: 'Website', href: companyPage.website || '#', icon: 'globe' }
        ],
        faqs: [
          {
            question: 'How can I contact customer support?',
            answer: `You can reach our customer support team at ${companyPage.phone} or ${companyPage.mainPhone || companyPage.phone} for 24x7 assistance.`
          },
          {
            question: 'What are your business hours?',
            answer: 'Our customer support is available 24x7. For specific services, please check individual department timings.'
          }
        ]
      };

      const overviewTab = await OverviewTab.create(defaultOverviewData);
      updatedTabs.overview = overviewTab._id;
      createdTabs.overview = overviewTab._id;
      console.log('✅ Default Overview Tab created for existing company:', overviewTab._id);
    }

    // Update the company page with new tabs
    const updatedCompanyPage = await Subcategory.findByIdAndUpdate(
      companyPage._id,
      {
        tabs: updatedTabs,
        // Add new tabs to selectedTabs if not already present
        $addToSet: {
          selectedTabs: { $each: Object.keys(createdTabs).map(key => key === 'contactNumbers' ? 'numbers' : key) }
        },
        // Only add the tabs that were actually created
        $addToSet: {
          selectedTabs: { $each: Object.keys(createdTabs).map(key => key === 'contactNumbers' ? 'numbers' : key) }
        }
      },
      { new: true }
    );

    // Populate the tabs data for response
    await updatedCompanyPage.populate([
      { path: 'tabs.numbers', model: 'ContactNumbersTab' },
      { path: 'tabs.overview', model: 'OverviewTab' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Default tabs created successfully for existing company',
      data: {
        companyPage: updatedCompanyPage,
        createdTabs,
        message: Object.keys(createdTabs).length > 0 
          ? `Created ${Object.keys(createdTabs).length} default tab(s)` 
          : 'All default tabs already exist'
      }
    });

  } catch (err) {
    console.error('❌ Error creating default tabs for existing company:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating default tabs',
      error: err.message
    });
  }
};
