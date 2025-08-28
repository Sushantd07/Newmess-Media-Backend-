// models/tabs/VideoGuideTab.js
import mongoose from "mongoose";
const { Schema } = mongoose;
import { HeadingSchema, VideoGuideSchema } from "../common/Common.js";

const VideoGuideTabSchema = new Schema(
  {
    heading: HeadingSchema,
    guides: [VideoGuideSchema],
  },
  { timestamps: true }
);

export default mongoose.model("VideoGuideTab", VideoGuideTabSchema);
