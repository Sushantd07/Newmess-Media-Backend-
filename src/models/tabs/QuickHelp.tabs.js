// models/tabs/QuickHelpTab.js
import mongoose from "mongoose";
const { Schema } = mongoose;
import { HeadingSchema, TableSchema, QuickLinkSchema, FaqSchema } from "../common/Common.js";

const QuickHelpTabSchema = new Schema(
  {
    heading: HeadingSchema,
    blocks: [
      {
        heading: HeadingSchema,
        description: String,
        table: TableSchema,      // optional
        links: [QuickLinkSchema] // optional
      },
    ],
    faqs: [FaqSchema],
  },
  { timestamps: true }
);

export default mongoose.model("QuickHelpTab", QuickHelpTabSchema);
