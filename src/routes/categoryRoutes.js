import express from "express";
import {
  createCategory,
  bulkCreateCategories,
  getCategories,
  getCategoriesWithSubcategories,
  getCategoryGridData,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getCompanyPageData,
  updateCategoryDisplayLimit,
  uploadCategoryIcon,
} from "../controllers/categoryController.js";
import categoryIconUpload from "../middleware/categoryIconUpload.js";

const router = express.Router();

// POST routes
router.post("/create", createCategory);
router.post("/bulk-create", bulkCreateCategories);
router.post("/upload-icon", categoryIconUpload.single('icon'), uploadCategoryIcon);

// GET routes
router.get("/", getCategories);
router.get("/with-subcategories", getCategoriesWithSubcategories);
router.get("/grid-data", getCategoryGridData);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/company/:subcategoryId", getCompanyPageData);
router.get("/:id", getCategoryById);

// PUT routes
router.put("/:id", updateCategory);
router.put("/:id/update-display-limit", updateCategoryDisplayLimit);

// DELETE routes
router.delete("/:id", deleteCategory);

export default router;
