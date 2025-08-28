// models/tabs/ComplaintsTab.js
import mongoose from "mongoose";
const { Schema } = mongoose;
import {
  HeadingSchema,
  ComplaintStepSchema,
  TableSchema,
  QuickLinkSchema,
} from "../common/Common.js";

const ComplaintsTabSchema = new Schema(
  {
    tabTitle: { type: String, default: "Complaints & Grievances" },
    tabDescription: String,
    
    // Main heading and introduction
    mainHeading: {
      title: String,
      subtitle: String,
      description: String,
    },
    
    // Complaint Methods Section
    complaintMethods: {
      heading: HeadingSchema,
      methods: [
        {
          methodNumber: Number,
          title: String,
          description: String,
          steps: [
            {
              stepNumber: Number,
              title: String,
              description: String,
              details: [String],
            }
          ],
          contactInfo: {
            phoneNumbers: [String],
            email: String,
            website: String,
            workingHours: String,
          },
          alternativeOptions: [String],
        }
      ]
    },
    
    // Escalation Levels Section
    escalationLevels: {
      heading: HeadingSchema,
      levels: [
        {
          levelNumber: Number,
          title: String,
          description: String,
          contactDetails: {
            department: String,
            phoneNumbers: [String],
            email: String,
            workingHours: String,
            address: String,
          },
          resolutionTimeline: String,
          escalationNote: String,
        }
      ]
    },
    
    // Regional Nodal Officers Section
    regionalNodalOfficers: {
      heading: HeadingSchema,
      description: String,
      table: {
        headers: [String],
        rows: [
          {
            region: String,
            statesCovered: String,
            emailId: String,
            contactNumber: String,
          }
        ]
      }
    },
    
    // RBI Banking Ombudsman Section
    rbiOmbudsman: {
      heading: HeadingSchema,
      description: String,
      portalInfo: {
        url: String,
        features: [String],
        cost: String,
        resolutionTimeline: String,
      },
      requirements: [String],
      process: [String],
    },
    
    // Best Practices Section
    bestPractices: {
      heading: HeadingSchema,
      subtitle: String,
      practices: [String],
    },
    
    // FAQs Section
    faqs: {
      heading: HeadingSchema,
      questions: [
        {
          question: String,
          answer: String,
        }
      ]
    },
    
    // Important Links Section
    importantLinks: [QuickLinkSchema],
    
    // Documents Required Section
    documentsRequired: {
      heading: HeadingSchema,
      documents: [String],
    },
    
    // Resolution Timeline Summary
    resolutionTimeline: {
      heading: HeadingSchema,
      timelines: [
        {
          level: String,
          days: String,
          description: String,
        }
      ]
    },
    
    // Note Section
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model("ComplaintsTab", ComplaintsTabSchema);
