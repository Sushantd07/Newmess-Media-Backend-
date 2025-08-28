// models/tabs/ContactNumbersTab.js
import mongoose from "mongoose";
const { Schema } = mongoose;
import {
  HeadingSchema,
  PhoneNumberSchema,
  TopContactCardSchema,
  TableSchema,
  StateOfficeSchema,
  SmsServiceSchema,
  IvrMenuSchema,
  QuickLinkSchema,
  EmailSupportSchema
} from "../common/Common.js";

const ContactNumbersTabSchema = new Schema(
  {
    tabTitle: { type: String, default: "Contact Numbers" }, 
    tabDescription: String, // e.g., "Customer care, helpline, toll-free numbers"

    // Section 1: Top Cards
    topContactCards: {
      heading: HeadingSchema,  // "Top Contact Cards"
      cards: [TopContactCardSchema]
    },

    // Section 2: National Numbers (list)
    nationalNumbersSection: {
      heading: HeadingSchema,
      items: [PhoneNumberSchema]
    },

    // Section 3: Helpline Table
    helplineNumbersSection: {
      heading: HeadingSchema,
      table: TableSchema
    },

    // Section 4: All India Numbers
    allIndiaNumbersSection: {
      heading: HeadingSchema,
      table: TableSchema
    },

    // Section 5: Service-wise Toll-Free Numbers
    serviceWiseNumbersSection: {
      heading: HeadingSchema,
      table: TableSchema
    },

    // Section 6: Statewise Numbers
    stateWiseNumbersSection: {
      heading: HeadingSchema,
      states: [StateOfficeSchema]
    },

    // Section 7: SMS Services
    smsServicesSection: {
      heading: HeadingSchema,
      services: [SmsServiceSchema]
    },

    // Section 8: IVR Menu
    ivrMenuSection: IvrMenuSchema,

    // Section 9: Quick Links
    quickLinksSection: {
      heading: HeadingSchema,
      links: [QuickLinkSchema]
    },

    // Section 10: Email Support
    emailSupportSection: {
      heading: HeadingSchema,
      table: TableSchema
    },

    // Section 11: NRI Phone Banking Support
    nriPhoneBankingSection: {
      heading: HeadingSchema,
      subsections: [
        {
          title: String,
          table: TableSchema
        }
      ]
    },

    // Section 12: Missed Call Service
    missedCallServiceSection: {
      heading: HeadingSchema,
      table: TableSchema
    },

    // Section 13: Customer Care List
    customerCareListSection: {
      heading: HeadingSchema,
      links: [
        {
          name: String,
          href: String
        }
      ]
    },

    // Section 14: Additional tables (Missed Call Service, Other Emails)
    additionalTables: [
      {
        heading: HeadingSchema,
        table: TableSchema
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("ContactNumbersTab", ContactNumbersTabSchema);
