import express from "express";
import {
  upsertDynamicPage,
  publishDynamicPage,
  getDynamicPage,
  listDynamicPages,
  deleteDynamicPage,
} from "../controllers/dynamicPageController.js";

const router = express.Router();

router.get("/", listDynamicPages);
router.get("/:pageId", getDynamicPage);
router.put("/:pageId", upsertDynamicPage);
router.post("/:pageId/publish", publishDynamicPage);
router.delete("/:pageId", deleteDynamicPage);

export default router;


