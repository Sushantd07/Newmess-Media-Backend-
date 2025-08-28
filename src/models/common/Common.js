// models/common/Common.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Generic heading block – lets you change any section title from admin
 */
const HeadingSchema = new Schema(
  {
    key: { type: String, required: true }, // e.g. 'topContactCards', 'ivrMenu'
    text: { type: String, required: true }, // visible heading
    subText: { type: String },              // optional subtitle
  },
  { _id: false }
);

/**
 * A generic "label/value" pair for meta information (founded, HQ, parent, rating)
 */
const MetaFieldSchema = new Schema(
  {
    label: String,
    value: String,
  },
  { _id: false }
);

/**
 * Phone number with meta
 */
const PhoneNumberSchema = new Schema(
  {
    type: String, // e.g. Customer Care, Credit Card Support
    number: { type: String, required: true },
    description: String,
    available: String, // 24x7, 10AM-5PM, etc.
    languages: [String],
    avgWaitTime: String,
  },
  { _id: false }
);

/**
 * Grid “card” on the top of Contact Numbers tab
 */
const TopContactCardSchema = new Schema(
  {
    title: String,
    number: String,
    subtitle: String,
    icon: String, // store lucide icon name you’ll map on FE
    colors: {
      cardBg: String,
      iconBg: String,
      textColor: String,
    },
  },
  { _id: false }
);

/**
 * Simple table model with fully dynamic headers and rows
 */
const TableSchema = new Schema(
  {
    heading: HeadingSchema,
    headers: [String], // table column titles shown on UI
    rows: [
      [
        { type: String }, // an array of rows, each row is an array of string cells
      ],
    ],
    // Optional richer rows (if you need copy buttons per cell)
    richRows: [
      {
        cells: [
          {
            label: String,
            value: String,
            copyable: { type: Boolean, default: true },
            meta: String, // timing, etc
          },
        ],
      },
    ],
  },
  { _id: false }
);

/**
 * State-wise numbers (modal + full table)
 */
const StateOfficeSchema = new Schema(
  {
    state: { type: String, required: true },
    city: String,
    type: String,
    number: String,
  },
  { _id: false }
);

/**
 * SMS services cards
 */
const SmsServiceSchema = new Schema(
  {
    code: String,
    description: String,
    number: String,
  },
  { _id: false }
);

/**
 * IVR menu – nested
 */
const IvrSubOptionSchema = new Schema(
  {
    option: String,
    description: String,
  },
  { _id: false }
);

const IvrOptionSchema = new Schema(
  {
    option: String,
    description: String,
    subOptions: [IvrSubOptionSchema],
  },
  { _id: false }
);

const IvrMenuSchema = new Schema(
  {
    heading: HeadingSchema,
    description: String,
    menus: [
      {
        title: String,
        options: [IvrOptionSchema]
      }
    ],
  },
  { _id: false }
);

/**
 * Quick links cards
 */
const QuickLinkSchema = new Schema(
  {
    title: String,
    url: String,
    description: String,
    icon: String,
    iconBg: String,
    priority: { type: String, enum: ["most-used", "high", "support", "account", "apps"], default: "most-used" },
  },
  { _id: false }
);

/**
 * Email support
 */
const EmailSupportSchema = new Schema(
  {
    service: String,
    email: String,
    timing: String,
  },
  { _id: false }
);

/**
 * Complaint steps / escalation
 */
const ComplaintStepSchema = new Schema(
  {
    level: Number, // 1,2,3...
    title: String,
    description: String,
    channels: [
      {
        type: { type: String, enum: ["phone", "email", "webform", "branch", "social"] },
        value: String,
        note: String,
      },
    ],
    documentsNeeded: [String],
    tatDays: Number, // expected resolution days
  },
  { _id: false }
);

/**
 * Video guide
 */
const VideoGuideSchema = new Schema(
  {
    title: String,
    videoId: String,
    thumbnail: String,
    duration: String,
    views: String,
    description: String,
  },
  { _id: false }
);

/**
 * FAQ
 */
const FaqSchema = new Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false }
);

export {
  HeadingSchema,
  MetaFieldSchema,
  PhoneNumberSchema,
  TopContactCardSchema,
  TableSchema,
  StateOfficeSchema,
  SmsServiceSchema,
  IvrMenuSchema,
  QuickLinkSchema,
  EmailSupportSchema,
  ComplaintStepSchema,
  VideoGuideSchema,
  FaqSchema,
};
