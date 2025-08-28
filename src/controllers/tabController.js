// controllers/tabController.js
import Tab from '../models/Tab.js';
import CompanyPage from '../models/CompanyPage.js';
import Subcategory from '../models/Subcategory.js';
import OverviewTab from '../models/tabs/OverviewTabs.js';
import ContactNumbersTab from '../models/tabs/ContactNumbers.tabs.js';
import ComplaintsTab from '../models/tabs/Complaint.tabs.js';
import QuickHelpTab from '../models/tabs/QuickHelp.tabs.js';
import VideoGuideTab from '../models/tabs/VideoGuide.tabs.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get all tabs for a specific company
const getCompanyTabs = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  
  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  try {
    // First try to find the company in CompanyPage collection
    let company = await CompanyPage.findOne({
      $or: [
        { _id: companyId },
        { slug: companyId }
      ]
    });

    // If not found in CompanyPage, try Subcategory
    if (!company) {
      company = await Subcategory.findOne({
        $or: [
          { _id: companyId },
          { slug: companyId },
          { id: companyId }
        ]
      });
    }

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    // Get system tabs from Tab collection
    const systemTabs = await Tab.find({ type: 'system' }).sort({ order: 1 });
    
    // Get custom tabs that are used by this company
    const customTabs = await Tab.find({
      $or: [
        { [`companyContent.${company._id}`]: { $exists: true } },
        { [`companyContent.${company.slug}`]: { $exists: true } }
      ],
      type: 'custom'
    }).sort({ order: 1 });

    // Transform system tabs
    const transformedSystemTabs = systemTabs.map(tab => {
      const companyContent = tab.companyContent.get(company._id) || tab.companyContent.get(company.slug);
      return {
        id: tab.tabId,
        label: tab.label,
        name: tab.name,
        icon: tab.icon,
        type: 'system',
        order: tab.order,
        content: companyContent ? companyContent.content : '',
        isActive: companyContent ? companyContent.isActive : true,
        lastUpdated: companyContent ? companyContent.lastUpdated : tab.updatedAt,
        createdBy: tab.createdBy,
        createdAt: tab.createdAt
      };
    });

    // Transform custom tabs
    const transformedCustomTabs = customTabs.map(tab => {
      const companyContent = tab.companyContent.get(company._id) || tab.companyContent.get(company.slug);
      return {
        id: tab.tabId,
        label: tab.label,
        name: tab.name,
        icon: tab.icon,
        type: 'custom',
        order: tab.order,
        content: companyContent ? companyContent.content : '',
        isActive: companyContent ? companyContent.isActive : true,
        lastUpdated: companyContent ? companyContent.lastUpdated : tab.updatedAt,
        createdBy: tab.createdBy,
        createdAt: tab.createdAt
      };
    });

    // Combine and sort all tabs
    const allTabs = [...transformedSystemTabs, ...transformedCustomTabs].sort((a, b) => a.order - b.order);

    res.status(200).json({
      success: true,
      data: {
        tabs: allTabs,
        companyId: company._id,
        companySlug: company.slug,
        totalTabs: allTabs.length
      }
    });
  } catch (error) {
    console.error('Error fetching company tabs:', error);
    throw new ApiError(500, "Failed to fetch company tabs");
  }
});

// Create a new tab for a company
const createTab = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { label, name, icon, content, order } = req.body;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  if (!label || !name) {
    throw new ApiError(400, "Tab label and name are required");
  }

  try {
    // Find the company
    let company = await CompanyPage.findOne({
      $or: [
        { _id: companyId },
        { slug: companyId }
      ]
    });

    if (!company) {
      company = await Subcategory.findOne({
        $or: [
          { _id: companyId },
          { slug: companyId },
          { id: companyId }
        ]
      });
    }

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    // Check if tab with same name already exists
    const existingTab = await Tab.findOne({ 
      name: name,
      type: 'custom'
    });

    let tab;
    
    if (existingTab) {
      // If tab exists, add this company to the tab's company content
      existingTab.setCompanyContent(company._id, content || '');
      tab = await existingTab.save();
    } else {
      // Create new tab
      tab = await Tab.createTab({
        name,
        label,
        icon: icon || 'FileText',
        content: content || '',
        order: order || 0
      }, company._id);
    }

    res.status(201).json({
      success: true,
      data: {
        tab: {
          id: tab.tabId,
          label: tab.label,
          name: tab.name,
          icon: tab.icon,
          type: tab.type,
          order: tab.order,
          content: content || '',
          isActive: true,
          lastUpdated: new Date(),
          createdBy: company._id,
          createdAt: tab.createdAt
        }
      },
      message: "Tab created successfully"
    });
  } catch (error) {
    console.error('Error creating tab:', error);
    throw new ApiError(500, "Failed to create tab");
  }
});

// Update a specific tab for a company
const updateTab = asyncHandler(async (req, res) => {
  const { companyId, tabId } = req.params;
  const { label, name, icon, content, order, isActive } = req.body;

  if (!companyId || !tabId) {
    throw new ApiError(400, "Company ID and Tab ID are required");
  }

  try {
    // Find the company
    let company = await CompanyPage.findOne({
      $or: [
        { _id: companyId },
        { slug: companyId }
      ]
    });

    if (!company) {
      company = await Subcategory.findOne({
        $or: [
          { _id: companyId },
          { slug: companyId },
          { id: companyId }
        ]
      });
    }

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    const tab = await Tab.findOne({ tabId });

    if (!tab) {
      throw new ApiError(404, "Tab not found");
    }

    // Update tab metadata if provided
    if (label) tab.label = label;
    if (name) tab.name = name;
    if (icon) tab.icon = icon;
    if (order !== undefined) tab.order = order;

    // Update company-specific content
    if (content !== undefined) {
      tab.setCompanyContent(company._id, content);
    }

    // Update active status
    if (isActive !== undefined) {
      const companyContent = tab.companyContent.get(company._id) || {};
      companyContent.isActive = isActive;
      tab.companyContent.set(company._id, companyContent);
    }

    await tab.save();

    const updatedCompanyContent = tab.companyContent.get(company._id);

    res.status(200).json({
      success: true,
      data: {
        tab: {
          id: tab.tabId,
          label: tab.label,
          name: tab.name,
          icon: tab.icon,
          type: tab.type,
          order: tab.order,
          content: updatedCompanyContent ? updatedCompanyContent.content : '',
          isActive: updatedCompanyContent ? updatedCompanyContent.isActive : true,
          lastUpdated: updatedCompanyContent ? updatedCompanyContent.lastUpdated : tab.updatedAt,
          createdBy: tab.createdBy,
          createdAt: tab.createdAt
        }
      },
      message: "Tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating tab:', error);
    throw new ApiError(500, "Failed to update tab");
  }
});

// Delete a tab for a specific company
const deleteTab = asyncHandler(async (req, res) => {
  const { companyId, tabId } = req.params;

  if (!companyId || !tabId) {
    throw new ApiError(400, "Company ID and Tab ID are required");
  }

  try {
    // Find the company
    let company = await CompanyPage.findOne({
      $or: [
        { _id: companyId },
        { slug: companyId }
      ]
    });

    if (!company) {
      company = await Subcategory.findOne({
        $or: [
          { _id: companyId },
          { slug: companyId },
          { id: companyId }
        ]
      });
    }

    if (!company) {
      throw new ApiError(404, "Company not found");
    }

    const tab = await Tab.findOne({ tabId });

    if (!tab) {
      throw new ApiError(404, "Tab not found");
    }

    // Remove company content from tab
    tab.companyContent.delete(company._id);
    await tab.save();

    // If no companies are using this tab anymore, delete it
    if (tab.companyContent.size === 0 && tab.type === 'custom') {
      await Tab.findByIdAndDelete(tab._id);
    }

    res.status(200).json({
      success: true,
      message: "Tab removed from company successfully"
    });
  } catch (error) {
    console.error('Error deleting tab:', error);
    throw new ApiError(500, "Failed to delete tab");
  }
});

// Reorder tabs for a company
const reorderTabs = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { tabOrders } = req.body; // Array of { tabId, order }

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  if (!Array.isArray(tabOrders)) {
    throw new ApiError(400, "Tab orders array is required");
  }

  try {
    // Update tab orders
    const updatePromises = tabOrders.map(({ tabId, order }) =>
      Tab.findOneAndUpdate(
        { tabId },
        { $set: { order } },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Tab order updated successfully"
    });
  } catch (error) {
    console.error('Error reordering tabs:', error);
    throw new ApiError(500, "Failed to reorder tabs");
  }
});

// Bulk update tabs for a company
const bulkUpdateTabs = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { tabs } = req.body;

  if (!companyId) {
    throw new ApiError(400, "Company ID is required");
  }

  if (!Array.isArray(tabs)) {
    throw new ApiError(400, "Tabs array is required");
  }

  try {
    const updatePromises = tabs.map(tabData => {
      const { id, label, name, icon, content, order, isActive } = tabData;
      
      return Tab.findOneAndUpdate(
        { tabId: id },
        {
          $set: {
            label,
            name,
            icon,
            order
          }
        },
        { new: true }
      ).then(tab => {
        if (tab && content !== undefined) {
          return tab.setCompanyContent(companyId, content);
        }
        return tab;
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Tabs updated successfully"
    });
  } catch (error) {
    console.error('Error bulk updating tabs:', error);
    throw new ApiError(500, "Failed to bulk update tabs");
  }
});

// Get all available tabs (for admin purposes)
const getAllTabs = asyncHandler(async (req, res) => {
  try {
    const tabs = await Tab.find().sort({ createdAt: -1 });

    const transformedTabs = tabs.map(tab => ({
      id: tab.tabId,
      label: tab.label,
      name: tab.name,
      icon: tab.icon,
      type: tab.type,
      order: tab.order,
      companiesUsing: Array.from(tab.companyContent.keys()),
      totalCompanies: tab.companyContent.size,
      createdBy: tab.createdBy,
      createdAt: tab.createdAt,
      updatedAt: tab.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        tabs: transformedTabs,
        totalTabs: transformedTabs.length
      }
    });
  } catch (error) {
    console.error('Error fetching all tabs:', error);
    throw new ApiError(500, "Failed to fetch all tabs");
  }
});

// Create specific tab types
const createOverviewTab = asyncHandler(async (req, res) => {
  const { tabTitle, tabDescription, content } = req.body;

  if (!tabTitle) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const overviewTab = await OverviewTab.create({
      tabTitle: tabTitle,
      tabDescription: tabDescription || '',
      content: content || ''
    });

    res.status(201).json({
      success: true,
      data: overviewTab,
      message: "Overview tab created successfully"
    });
  } catch (error) {
    console.error('Error creating overview tab:', error);
    throw new ApiError(500, "Failed to create overview tab");
  }
});

const createContactNumbersTab = asyncHandler(async (req, res) => {
  const { tabTitle, tabDescription, content } = req.body;

  if (!tabTitle) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const contactNumbersTab = await ContactNumbersTab.create({
      tabTitle: tabTitle,
      tabDescription: tabDescription || '',
      content: content || ''
    });

    res.status(201).json({
      success: true,
      data: contactNumbersTab,
      message: "Contact numbers tab created successfully"
    });
  } catch (error) {
    console.error('Error creating contact numbers tab:', error);
    throw new ApiError(500, "Failed to create contact numbers tab");
  }
});

const createComplaintsTab = asyncHandler(async (req, res) => {
  const { tabTitle, tabDescription, content } = req.body;

  if (!tabTitle) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const complaintsTab = await ComplaintsTab.create({
      tabTitle: tabTitle,
      tabDescription: tabDescription || '',
      content: content || ''
    });

    res.status(201).json({
      success: true,
      data: complaintsTab,
      message: "Complaints tab created successfully"
    });
  } catch (error) {
    console.error('Error creating complaints tab:', error);
    throw new ApiError(500, "Failed to create complaints tab");
  }
});

const createQuickHelpTab = asyncHandler(async (req, res) => {
  const { tabTitle, tabDescription, content } = req.body;

  if (!tabTitle) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const quickHelpTab = await QuickHelpTab.create({
      tabTitle: tabTitle,
      tabDescription: tabDescription || '',
      content: content || ''
    });

    res.status(201).json({
      success: true,
      data: quickHelpTab,
      message: "Quick help tab created successfully"
    });
  } catch (error) {
    console.error('Error creating quick help tab:', error);
    throw new ApiError(500, "Failed to create quick help tab");
  }
});

const createVideoGuideTab = asyncHandler(async (req, res) => {
  const { tabTitle, tabDescription, content } = req.body;

  if (!tabTitle) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const videoGuideTab = await VideoGuideTab.create({
      tabTitle: tabTitle,
      tabDescription: tabDescription || '',
      content: content || ''
    });

    res.status(201).json({
      success: true,
      data: videoGuideTab,
      message: "Video guide tab created successfully"
    });
  } catch (error) {
    console.error('Error creating video guide tab:', error);
    throw new ApiError(500, "Failed to create video guide tab");
  }
});

// Update specific tab types
const updateOverviewTab = asyncHandler(async (req, res) => {
  const { tabId } = req.params;
  const { tabTitle, content } = req.body;

  if (!tabId) {
    throw new ApiError(400, "Tab ID is required");
  }

  try {
    const updatedTab = await OverviewTab.findByIdAndUpdate(
      tabId,
      {
        tabTitle: tabTitle,
        content: content
      },
      { new: true }
    );

    if (!updatedTab) {
      throw new ApiError(404, "Overview tab not found");
    }

    res.status(200).json({
      success: true,
      data: updatedTab,
      message: "Overview tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating overview tab:', error);
    throw new ApiError(500, "Failed to update overview tab");
  }
});

const updateContactNumbersTab = asyncHandler(async (req, res) => {
  const { tabId } = req.params;
  const { tabTitle, content } = req.body;

  if (!tabId) {
    throw new ApiError(400, "Tab title is required");
  }

  try {
    const updatedTab = await ContactNumbersTab.findByIdAndUpdate(
      tabId,
      {
        tabTitle: tabTitle,
        content: content
      },
      { new: true }
    );

    if (!updatedTab) {
      throw new ApiError(404, "Contact numbers tab not found");
    }

    res.status(200).json({
      success: true,
      data: updatedTab,
      message: "Contact numbers tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating contact numbers tab:', error);
    throw new ApiError(500, "Failed to update contact numbers tab");
  }
});

const updateComplaintsTab = asyncHandler(async (req, res) => {
  const { tabId } = req.params;
  const { tabTitle, content } = req.body;

  if (!tabId) {
    throw new ApiError(400, "Tab ID is required");
  }

  try {
    const updatedTab = await ComplaintsTab.findByIdAndUpdate(
      tabId,
      {
        tabTitle: tabTitle,
        content: content
      },
      { new: true }
    );

    if (!updatedTab) {
      throw new ApiError(404, "Complaints tab not found");
    }

    res.status(200).json({
      success: true,
      data: updatedTab,
      message: "Complaints tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating complaints tab:', error);
    throw new ApiError(500, "Failed to update complaints tab");
  }
});

const updateQuickHelpTab = asyncHandler(async (req, res) => {
  const { tabId } = req.params;
  const { tabTitle, content } = req.body;

  if (!tabId) {
    throw new ApiError(400, "Tab ID is required");
  }

  try {
    const updatedTab = await QuickHelpTab.findByIdAndUpdate(
      tabId,
      {
        tabTitle: tabTitle,
        content: content
      },
      { new: true }
    );

    if (!updatedTab) {
      throw new ApiError(404, "Quick help tab not found");
    }

    res.status(200).json({
      success: true,
      data: updatedTab,
      message: "Quick help tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating quick help tab:', error);
    throw new ApiError(500, "Failed to update quick help tab");
  }
});

const updateVideoGuideTab = asyncHandler(async (req, res) => {
  const { tabId } = req.params;
  const { tabTitle, content } = req.body;

  if (!tabId) {
    throw new ApiError(400, "Tab ID is required");
  }
  try {
    const updatedTab = await VideoGuideTab.findByIdAndUpdate(
      tabId,
      {
        tabTitle: tabTitle,
        content: content
      },
      { new: true }
    );

    if (!updatedTab) {
      throw new ApiError(404, "Video guide tab not found");
    }

    res.status(200).json({
      success: true,
      data: updatedTab,
      message: "Video guide tab updated successfully"
    });
  } catch (error) {
    console.error('Error updating video guide tab:', error);
    throw new ApiError(500, "Failed to update video guide tab");
  }
});

export {
  getCompanyTabs,
  createTab,
  updateTab,
  deleteTab,
  reorderTabs,
  bulkUpdateTabs,
  getAllTabs,
  createOverviewTab,
  createContactNumbersTab,
  createComplaintsTab,
  createQuickHelpTab,
  createVideoGuideTab,
  updateOverviewTab,
  updateContactNumbersTab,
  updateComplaintsTab,
  updateQuickHelpTab,
  updateVideoGuideTab
};
