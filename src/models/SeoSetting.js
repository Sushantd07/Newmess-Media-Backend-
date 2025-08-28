import mongoose from 'mongoose';

const SeoSettingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['home', 'all-categories', 'category', 'subcategory', 'company', 'route'],
      required: true,
      index: true,
    },
    // Unique identifier depending on the type
    // home -> 'home'
    // all-categories -> 'all-categories'
    // category -> categoryId or slug
    // subcategory -> `${categoryId}__${subcategoryId}`
    // company -> companySlug or companyId
    identifier: { type: String, required: true, index: true },

    // Core SEO
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    canonical: { type: String, default: '' },
    robots: { type: String, default: 'index,follow' },
    lang: { type: String, default: 'en' },
    publisher: { type: String, default: '' },

    // OpenGraph / Twitter
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    twitterCard: { type: String, default: 'summary_large_image' },

    // Structured data (JSON-LD)
    structuredData: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Optional per-tab SEO for company pages: { contactnumber: {..}, complain: {..}, ... }
    tabs: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

SeoSettingSchema.index({ type: 1, identifier: 1 }, { unique: true });

const SeoSetting = mongoose.model('SeoSetting', SeoSettingSchema);
export default SeoSetting;


