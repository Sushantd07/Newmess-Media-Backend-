import mongoose from "mongoose";

const { Schema } = mongoose;

const DynamicSectionSchema = new Schema(
  {
    component: { type: String, required: true },
    props: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const DynamicPageSchema = new Schema(
  {
    pageId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    slug: { type: String, index: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    sections: { type: [DynamicSectionSchema], default: [] },
    // Optional linkage to existing company page if desired
    companySlug: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("DynamicPage", DynamicPageSchema);


