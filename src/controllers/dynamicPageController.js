import DynamicPage from "../models/DynamicPage.js";

export const upsertDynamicPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const payload = req.body;

    if (!payload || !payload.sections) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const updated = await DynamicPage.findOneAndUpdate(
      { pageId },
      { ...payload, pageId },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const publishDynamicPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await DynamicPage.findOneAndUpdate(
      { pageId },
      { status: "published" },
      { new: true }
    );
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getDynamicPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const page = await DynamicPage.findOne({ pageId });
    if (!page) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const listDynamicPages = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const pages = await DynamicPage.find(filter).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteDynamicPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    const deleted = await DynamicPage.findOneAndDelete({ pageId });
    if (!deleted) return res.status(404).json({ success: false, message: "Page not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


