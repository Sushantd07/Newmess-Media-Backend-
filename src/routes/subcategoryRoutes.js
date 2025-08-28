import express from "express";
import Subcategory from "../models/Subcategory.js";
import logoUpload from "../middleware/logoUpload.js";
import compressLogo from "../middleware/logoCompression.js";
import companyLogoUpload from "../middleware/companyLogoUpload.js";
import {
  createSubcategory,
  bulkCreateSubcategories,
  getSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
  bulkCreateSubcategoriesByCategoryId,
  createCompanyPage,
  linkContactTabToCompany,
  getCompanyPageData,
  createContactNumbersData,
  addContactNumbersToCompanyBySlug,
  addComplaintsToCompanyBySlug,
  updateCompanyPage,
  createDefaultTabsForCompany,
  deleteContactNumbersFromCompanyBySlug,
} from "../controllers/subcategoryController.js";

const router = express.Router();

// POST routes
router.post("/create", createSubcategory);
router.post("/bulk-create", bulkCreateSubcategories);
router.post("/category/:categoryId/bulk-create", bulkCreateSubcategoriesByCategoryId);

// GET routes
router.get("/", getSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategory);
router.get("/:id", getSubcategoryById);

// PUT routes
router.put("/company-page/:id", updateCompanyPage);
router.put("/:id", updateSubcategory);

// DELETE routes
router.delete("/:id", deleteSubcategory);

// Company Page Routes
router.post("/create-company-page", 
  companyLogoUpload.single('logo'), 
  createCompanyPage
);
router.post("/link-contact-tab", linkContactTabToCompany);
router.post("/create-contact-numbers", createContactNumbersData);
router.post("/company/:slug/add-contact-numbers", addContactNumbersToCompanyBySlug);
router.post("/company/:slug/add-complaints", addComplaintsToCompanyBySlug);
router.post("/company/:slug/create-default-tabs", createDefaultTabsForCompany);
router.get("/company/:companyId", getCompanyPageData);
router.delete("/company/:slug/contact-numbers", deleteContactNumbersFromCompanyBySlug);



export default router;
