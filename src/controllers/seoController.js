import SeoSetting from '../models/SeoSetting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const upsertSeo = asyncHandler(async (req, res) => {
  const { type, identifier, tab } = req.body;
  if (!type || !identifier) {
    return res.status(400).json({ success: false, message: 'type and identifier are required' });
  }
  const update = { ...req.body, type };
  const filter = type === 'route' ? { identifier } : { type, identifier };
  let doc = await SeoSetting.findOne(filter);
  if (!doc) {
    // If creating a company record for a specific tab, store values under tabs[tab]
    if (type === 'company' && tab) {
      doc = await SeoSetting.create({
        type,
        identifier,
        tabs: {
          [tab]: { ...req.body },
        },
      });
    } else {
      doc = await SeoSetting.create(update);
    }
  } else {
    if (type === 'company' && tab) {
      doc.tabs = doc.tabs || {};
      doc.tabs[tab] = { ...(doc.tabs[tab] || {}), ...req.body };
    } else {
      Object.assign(doc, update);
    }
    await doc.save();
  }
  return res.json({ success: true, data: doc });
});

export const getSeo = asyncHandler(async (req, res) => {
  const { type, identifier, path, tab } = req.query;
  if (!type || !identifier) {
    return res.status(400).json({ success: false, message: 'type and identifier are required' });
  }
  // Support route-based lookup if type === 'route' (identifier is the pathname)
  let doc = null;
  if (type === 'route') {
    const routeId = path || identifier;
    doc = await SeoSetting.findOne({ type: 'route', identifier: routeId });
    if (!doc) {
      // Fallback for legacy docs saved without type
      doc = await SeoSetting.findOne({ identifier: routeId });
    }
    if (!doc) {
      // Friendly fallbacks for common static routes that may have been saved under previous types
      if (routeId === '/') {
        doc = await SeoSetting.findOne({ type: 'home', identifier: 'home' });
      } else if (routeId === '/category') {
        doc = await SeoSetting.findOne({ type: 'all-categories', identifier: 'all-categories' });
      }
    }
  } else {
    // 1) Exact match
    doc = await SeoSetting.findOne({ type, identifier });
    if (!doc) {
      // 2) Try decoded identifier
      const decoded = safeDecode(identifier);
      if (decoded && decoded !== identifier) {
        doc = await SeoSetting.findOne({ type, identifier: decoded });
      }
    }
    if (!doc) {
      // 3) Case-insensitive exact match using regex
      const escaped = escapeRegex(identifier);
      doc = await SeoSetting.findOne({ type, identifier: { $regex: `^${escaped}$`, $options: 'i' } });
    }
    if (!doc && type === 'company') {
      // 4) Fallback for legacy docs saved only inside tabs
      const or = [];
      const tabKeys = tab ? [tab] : ['contactnumber', 'complain', 'quickhelp', 'videoguide', 'overview'];
      for (const key of tabKeys) {
        or.push({ [`tabs.${key}.identifier`]: identifier });
        const decoded = safeDecode(identifier);
        if (decoded && decoded !== identifier) {
          or.push({ [`tabs.${key}.identifier`]: decoded });
        }
      }
      if (or.length) {
        doc = await SeoSetting.findOne({ $or: or });
      }
    }
  }
  let response = doc ? doc.toObject() : null;
  if (response && type === 'company' && tab && response.tabs && response.tabs[tab]) {
    response = { ...response, ...response.tabs[tab] };
  }
  return res.json({ success: true, data: response || null });
});

export const deleteSeo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await SeoSetting.findByIdAndDelete(id);
  return res.json({ success: true });
});

// Utils
function safeDecode(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return value;
  }
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


