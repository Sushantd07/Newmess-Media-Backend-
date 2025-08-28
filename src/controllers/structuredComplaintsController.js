// controllers/structuredComplaintsController.js
import StructuredComplaints from '../models/StructuredComplaints.js';
import Subcategory from '../models/Subcategory.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get structured complaints data for a company
const getStructuredComplaints = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  // Find the subcategory (company) first - support both ObjectId and slug
  let subcategory;
  if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
    // It's a MongoDB ObjectId
    subcategory = await Subcategory.findById(companyId);
  } else {
    // It's a slug
    subcategory = await Subcategory.findOne({ slug: companyId });
  }
  
  if (!subcategory) {
    throw new ApiError(404, "Company not found");
  }
  
  // Use the actual ObjectId for the structured complaints
  const actualCompanyId = subcategory._id;

  // Find the latest structured complaints data
  const structuredComplaints = await StructuredComplaints.findByCompanyPage(actualCompanyId);

  res.status(200).json({
    success: true,
    data: structuredComplaints,
    message: "Structured complaints data retrieved successfully"
  });
});

// Create or update structured complaints data
const createOrUpdateStructuredComplaints = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const {
    mainHeading,
    complaintMethods,
    escalationLevels,
    documentsRequired,
    resolutionTimeline,
    note,
    richTextContent,
    sourceDocument
  } = req.body;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  // Find the subcategory (company) first - support both ObjectId and slug
  let subcategory;
  if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
    // It's a MongoDB ObjectId
    subcategory = await Subcategory.findById(companyId);
  } else {
    // It's a slug
    subcategory = await Subcategory.findOne({ slug: companyId });
  }
  
  if (!subcategory) {
    throw new ApiError(404, "Company not found");
  }
  
  // Use the actual ObjectId for the structured complaints
  const actualCompanyId = subcategory._id;

  // Check if structured complaints data already exists
  let structuredComplaints = await StructuredComplaints.findByCompanyPage(actualCompanyId);

  if (structuredComplaints) {
    // Update existing data
    structuredComplaints.mainHeading = mainHeading || structuredComplaints.mainHeading;
    structuredComplaints.complaintMethods = complaintMethods || structuredComplaints.complaintMethods;
    structuredComplaints.escalationLevels = escalationLevels || structuredComplaints.escalationLevels;
    structuredComplaints.documentsRequired = documentsRequired || structuredComplaints.documentsRequired;
    structuredComplaints.resolutionTimeline = resolutionTimeline || structuredComplaints.resolutionTimeline;
    structuredComplaints.note = note || structuredComplaints.note;
    structuredComplaints.richTextContent = richTextContent || structuredComplaints.richTextContent;
    
    if (sourceDocument) {
      structuredComplaints.sourceDocument = {
        ...structuredComplaints.sourceDocument,
        ...sourceDocument,
        processedAt: new Date(),
        wordCount: richTextContent ? richTextContent.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
        structureExtracted: true
      };
    }

    await structuredComplaints.save();
  } else {
    // Create new structured complaints data
    structuredComplaints = new StructuredComplaints({
      companyPageId: actualCompanyId,
      mainHeading,
      complaintMethods,
      escalationLevels,
      documentsRequired,
      resolutionTimeline,
      note,
      richTextContent,
      sourceDocument: sourceDocument ? {
        ...sourceDocument,
        processedAt: new Date(),
        wordCount: richTextContent ? richTextContent.replace(/<[^>]*>/g, '').split(/\s+/).length : 0,
        structureExtracted: true
      } : null,
      processingStatus: 'completed',
      lastProcessed: new Date()
    });

    await structuredComplaints.save();
  }

  // Validate the structure
  const validation = structuredComplaints.validateStructure();
  if (!validation.isValid) {
    console.warn('Structure validation warnings:', validation.errors);
  }

  res.status(200).json({
    success: true,
    data: structuredComplaints,
    message: "Structured complaints data saved successfully",
    validation: validation
  });
});

// Process Word document content and extract structure
const processWordDocument = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { content } = req.body;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  // Find the subcategory (company) first
  const subcategory = await Subcategory.findById(companyId);
  if (!subcategory) {
    throw new ApiError(404, "Company not found");
  }

  try {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const structuredData = {
      mainHeading: { title: '', description: '' },
      complaintMethods: {
        heading: { text: 'How to File a Complaint', subText: 'Choose from multiple methods to file your complaint' },
        methods: []
      },
      escalationLevels: {
        heading: { text: 'Escalation Levels', subText: 'Follow these levels if your complaint is not resolved' },
        levels: []
      },
      documentsRequired: {
        heading: { text: 'Documents Required', subText: 'Prepare these documents before filing your complaint' },
        documents: []
      },
      resolutionTimeline: {
        heading: { text: 'Resolution Timeline', subText: 'Expected timeframes for complaint resolution' },
        timelines: []
      },
      note: ''
    };

    // Extract main heading
    const h1 = tempDiv.querySelector('h1');
    if (h1) {
      structuredData.mainHeading.title = h1.textContent.trim();
      structuredData.mainHeading.description = 'Complaint redressal process for ' + subcategory.name;
    }

    // Extract complaint methods
    const methods = [];
    const methodSections = tempDiv.querySelectorAll('h2, h3');
    methodSections.forEach((section, index) => {
      if (section.textContent.toLowerCase().includes('method') || 
          section.textContent.toLowerCase().includes('step') ||
          section.textContent.toLowerCase().includes('process')) {
        
        const method = {
          methodNumber: index + 1,
          title: section.textContent.trim(),
          description: '',
          steps: [],
          contactInfo: {
            phoneNumbers: [],
            emailAddresses: [],
            websites: []
          }
        };
        
        // Get description from next paragraph
        let nextElement = section.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H2' && nextElement.tagName !== 'H3') {
          if (nextElement.tagName === 'P') {
            method.description += nextElement.textContent.trim() + ' ';
          }
          nextElement = nextElement.nextElementSibling;
        }
        
        // Extract steps from lists
        const stepsList = section.parentElement.querySelector('ol, ul');
        if (stepsList) {
          const listItems = stepsList.querySelectorAll('li');
          listItems.forEach((item, stepIndex) => {
            method.steps.push({
              stepNumber: stepIndex + 1,
              title: item.textContent.trim(),
              description: '',
              details: []
            });
          });
        }
        
        // Extract contact information
        const contactSection = tempDiv.querySelector('*:contains("Contact"), *:contains("Phone"), *:contains("Email")');
        if (contactSection) {
          const phoneMatches = contactSection.textContent.match(/\b\d{10,}\b/g);
          const emailMatches = contactSection.textContent.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
          
          if (phoneMatches) method.contactInfo.phoneNumbers = phoneMatches;
          if (emailMatches) method.contactInfo.emailAddresses = emailMatches;
        }
        
        methods.push(method);
      }
    });
    
    structuredData.complaintMethods.methods = methods;
    
    // Extract escalation levels
    const escalationSection = tempDiv.querySelector('*:contains("Escalation"), *:contains("Level")');
    if (escalationSection) {
      const levels = [];
      const levelElements = escalationSection.querySelectorAll('h3, h4');
      levelElements.forEach((level, index) => {
        if (level.textContent.toLowerCase().includes('level')) {
          levels.push({
            levelNumber: index + 1,
            title: level.textContent.trim(),
            description: '',
            contactDetails: {
              phoneNumbers: [],
              emailAddresses: [],
              websites: []
            }
          });
        }
      });
      structuredData.escalationLevels.levels = levels;
    }
    
    // Extract documents required
    const documentsSection = tempDiv.querySelector('*:contains("Document"), *:contains("Required")');
    if (documentsSection) {
      const documents = [];
      const listItems = documentsSection.querySelectorAll('li');
      listItems.forEach(item => {
        documents.push(item.textContent.trim());
      });
      structuredData.documentsRequired.documents = documents;
    }
    
    // Extract resolution timeline
    const timelineSection = tempDiv.querySelector('*:contains("Timeline"), *:contains("Resolution")');
    if (timelineSection) {
      const timelines = [];
      const timelineElements = timelineSection.querySelectorAll('h3, h4');
      timelineElements.forEach((timeline, index) => {
        timelines.push({
          level: timeline.textContent.trim(),
          days: '3-5 days',
          description: 'Standard resolution time'
        });
      });
      structuredData.resolutionTimeline.timelines = timelines;
    }
    
    // Extract note
    const noteSection = tempDiv.querySelector('*:contains("Note"), *:contains("Important")');
    if (noteSection) {
      structuredData.note = noteSection.textContent.trim();
    }

    // Save the processed data
    let structuredComplaints = await StructuredComplaints.findByCompanyPage(companyId);
    
    if (structuredComplaints) {
      // Update existing
      structuredComplaints.mainHeading = structuredData.mainHeading;
      structuredComplaints.complaintMethods = structuredData.complaintMethods;
      structuredComplaints.escalationLevels = structuredData.escalationLevels;
      structuredComplaints.documentsRequired = structuredData.documentsRequired;
      structuredComplaints.resolutionTimeline = structuredData.resolutionTimeline;
      structuredComplaints.note = structuredData.note;
      structuredComplaints.richTextContent = content;
      structuredComplaints.sourceDocument = {
        originalContent: content,
        processedAt: new Date(),
        wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        structureExtracted: true
      };
      
      await structuredComplaints.save();
    } else {
      // Create new
      structuredComplaints = new StructuredComplaints({
        companyPageId: companyId,
        ...structuredData,
        richTextContent: content,
        sourceDocument: {
          originalContent: content,
          processedAt: new Date(),
          wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
          structureExtracted: true
        },
        processingStatus: 'completed',
        lastProcessed: new Date()
      });
      
      await structuredComplaints.save();
    }

    res.status(200).json({
      success: true,
      data: structuredComplaints,
      message: "Word document processed and structured successfully"
    });

  } catch (error) {
    console.error('Error processing Word document:', error);
    throw new ApiError(500, "Error processing Word document: " + error.message);
  }
});

// Delete structured complaints data
const deleteStructuredComplaints = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  const result = await StructuredComplaints.deleteMany({ companyPageId: companyId });

  res.status(200).json({
    success: true,
    message: "Structured complaints data deleted successfully",
    deletedCount: result.deletedCount
  });
});

// Get processing status
const getProcessingStatus = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  const structuredComplaints = await StructuredComplaints.findByCompanyPage(companyId);

  if (!structuredComplaints) {
    return res.status(200).json({
      success: true,
      data: {
        processingStatus: 'not_found',
        message: 'No structured complaints data found'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      processingStatus: structuredComplaints.processingStatus,
      lastProcessed: structuredComplaints.lastProcessed,
      version: structuredComplaints.version,
      summary: structuredComplaints.getSummary()
    }
  });
});

export {
  getStructuredComplaints,
  createOrUpdateStructuredComplaints,
  processWordDocument,
  deleteStructuredComplaints,
  getProcessingStatus
}; 