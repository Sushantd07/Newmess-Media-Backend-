import express from "express";
import logoUpload from "../middleware/logoUpload.js";
import compressLogo from "../middleware/logoCompression.js";
import companyLogoUpload from "../middleware/companyLogoUpload.js";
import {
  createCompanyPage,
  createCompanyPageWithContactNumbers,
  createContactNumbersTab,
  addContactNumbersToCompany,
  getAllCompanyPages,
  listAllCompaniesLite,
  listCompaniesByCategorySlug,
  getCompanyPageBySlug,
  getCompanyPagesByCategory,
  updateCompanyPage,
  deleteCompanyPage,
  searchCompanyPages,
  getCompanyPageTab,
  updateContactNumbersTab,
  saveDynamicComponents,
  uploadCompanyLogo,
  deleteCompanyLogo
} from "../controllers/companyPageController.js";

const router = express.Router();

// 🟢 Company Page CRUD Operations
router.post("/create", createCompanyPage);
router.post("/create-with-contact-numbers", createCompanyPageWithContactNumbers);
router.post("/create-contact-numbers", createContactNumbersTab);

// 🟡 Add Tabs to Existing Company Page
router.post("/:slug/add-contact-numbers", addContactNumbersToCompany);
router.get("/", getAllCompanyPages);
router.get("/all-lite", listAllCompaniesLite);
router.get("/category/:categorySlug/all", listCompaniesByCategorySlug);
router.get("/search", searchCompanyPages);
router.get("/:slug", getCompanyPageBySlug);
router.put("/:slug", updateCompanyPage);
router.delete("/:slug", deleteCompanyPage);

// 🔵 Category-based Routes
router.get("/category/:categoryId", getCompanyPagesByCategory);
router.get("/category/:categoryId/:subCategoryId", getCompanyPagesByCategory);

// 🟡 Tab-specific Routes
router.get("/:slug/tab/:tabName", getCompanyPageTab);
router.put("/:slug/contact-numbers", updateContactNumbersTab);

// 🟢 Dynamic Components Routes
router.post("/save-component", saveDynamicComponents);

// 🟢 Logo Upload Routes
router.post("/:slug/upload-logo", 
  companyLogoUpload.single('logo'), 
  uploadCompanyLogo
);
router.delete("/:slug/delete-logo", deleteCompanyLogo);

export default router; 