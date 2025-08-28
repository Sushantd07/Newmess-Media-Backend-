// routes/structuredComplaintsRoutes.js
import express from 'express';
import {
  getStructuredComplaints,
  createOrUpdateStructuredComplaints,
  processWordDocument,
  deleteStructuredComplaints,
  getProcessingStatus
} from '../controllers/structuredComplaintsController.js';

const router = express.Router();

// Get structured complaints data for a company
router.get('/company/:companyId', getStructuredComplaints);

// Create or update structured complaints data
router.post('/company/:companyId', createOrUpdateStructuredComplaints);

// Process Word document and extract structure
router.post('/company/:companyId/process-word', processWordDocument);

// Delete structured complaints data
router.delete('/company/:companyId', deleteStructuredComplaints);

// Get processing status
router.get('/company/:companyId/status', getProcessingStatus);

export default router; 