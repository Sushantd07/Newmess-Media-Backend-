// models/tabs/OverviewTab.js
import mongoose from "mongoose";
const { Schema } = mongoose;
import {
  HeadingSchema,
  MetaFieldSchema,
  QuickLinkSchema,
  FaqSchema,
} from "../common/Common.js";

const OverviewTabSchema = new Schema(
  {
    heading: HeadingSchema,
    about: {
      title: String,
      description: String,
    },
    meta: [MetaFieldSchema], // founded, HQ, parent, rating etc.
    services: [String],
    quickLinks: [QuickLinkSchema],
    faqs: [FaqSchema],
  },
  { timestamps: true }
);

export default mongoose.model("OverviewTab", OverviewTabSchema);
