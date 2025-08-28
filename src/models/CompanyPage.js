// models/CompanyPage.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const CompanyPageSchema = new Schema(
  {
    // URL params you already use
    categoryId: { type: String, required: true },     // banking, telecom...
    subCategoryId: { type: String, required: true },  // private-banks, mobile-networks...
    slug: { type: String, required: true, unique: true }, // hdfc-bank

    // generic company header info (all dynamic)
    name: { type: String, required: true },
    logo: {
      url: String,
      publicId: String
    },
    description: String,
    rating: Number,
    totalReviews: Number,
    monthlySearches: String,
    founded: String,
    headquarters: String,
    website: String,
    parentCompany: String,

    // map tabs
    tabs: {
      numbers: { type: Schema.Types.ObjectId, ref: "ContactNumbersTab" },
      complaints: { type: Schema.Types.ObjectId, ref: "ComplaintsTab" },
      quickhelp: { type: Schema.Types.ObjectId, ref: "QuickHelpTab" },
      video: { type: Schema.Types.ObjectId, ref: "VideoGuideTab" },
      overview: { type: Schema.Types.ObjectId, ref: "OverviewTab" },
    },

    // selected tabs for this company (array of tab IDs that are enabled)
    selectedTabs: [{
      type: String,
      enum: ["overview", "numbers", "complaints", "quickhelp", "video"],
      default: []
    }],

    // global FAQs if you want a universal FAQ across tabs
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],

    // dynamic components for admin editing
    dynamicComponents: [
      {
        id: Number,
        type: String, // 'card' or 'table'
        data: Schema.Types.Mixed
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CompanyPage", CompanyPageSchema);
