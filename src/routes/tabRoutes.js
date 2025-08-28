// routes/tabRoutes.js
import express from 'express';
import {
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
} from '../controllers/tabController.js';

const router = express.Router();

// Get all tabs for a specific company
router.get('/company/:companyId', getCompanyTabs);

// Create a new tab for a company
router.post('/company/:companyId', createTab);

// Update a specific tab for a company
router.put('/company/:companyId/:tabId', updateTab);

// Delete a tab for a specific company
router.delete('/company/:companyId/:tabId', deleteTab);

// Reorder tabs for a company
router.put('/company/:companyId/reorder', reorderTabs);

// Bulk update tabs for a company
router.post('/company/:companyId/bulk', bulkUpdateTabs);

// Get all available tabs (admin endpoint)
router.get('/all', getAllTabs);

// Create specific tab types
router.post('/overview', createOverviewTab);
router.post('/contact-numbers', createContactNumbersTab);
router.post('/complaints', createComplaintsTab);
router.post('/quick-help', createQuickHelpTab);
router.post('/video-guide', createVideoGuideTab);

// Update specific tab types
router.put('/overview/:tabId', updateOverviewTab);
router.put('/contact-numbers/:tabId', updateContactNumbersTab);
router.put('/complaints/:tabId', updateComplaintsTab);
router.put('/quick-help/:tabId', updateQuickHelpTab);
router.put('/video-guide/:tabId', updateVideoGuideTab);

export default router;