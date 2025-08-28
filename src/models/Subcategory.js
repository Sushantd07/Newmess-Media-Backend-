import mongoose from 'mongoose';

const SubcategorySchema = new mongoose.Schema(
  {
    // Core identification fields
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    
    // Contact information (Home Page Data)
    phone: {
      type: String,
      required: true,
    },
    mainPhone: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    
    // Role/Department for dynamic label (replaces hardcoded "Support")
    role: {
      type: String,
      default: 'Support',
    },
    
    // Visual and branding (Home Page Data)
    logo: {
      type: String,
      default: '',
    },
    
    // Verification and status
    verified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Categorization
    tags: [{
      type: String,
    }],
    
    // Location and timing (Home Page Data)
    address: {
      type: String,
      default: 'All India',
    },
    timing: {
      type: String,
      default: 'Mon - Sat, 9 AM - 5 PM',
    },
    
    // Organization
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },

    // Company Page Data (Detailed Information)
    description: {
      type: String,
      default: '',
    },
    companyName: {
      type: String,
      default: '',
    },
    founded: {
      type: String,
      default: '',
    },
    headquarters: {
      type: String,
      default: '',
    },
    parentCompany: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    complaintContent: {
      type: String,
      default: '',
    },
    
    // Company Page Tabs Data
    tabs: {
      numbers: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ContactNumbersTab',
        default: null,
      },
      complaints: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ComplaintsTab',
        default: null,
      },
      quickhelp: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuickHelpTab',
        default: null,
      },
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoGuideTab',
        default: null,
      },
      overview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OverviewTab',
        default: null,
      },
    },

    // selected tabs for this company (array of tab IDs that are enabled)
    selectedTabs: [{
      type: String,
      enum: ["overview", "numbers", "complaints", "quickhelp", "video"],
      default: []
    }],
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
SubcategorySchema.index({ id: 1 });
SubcategorySchema.index({ slug: 1 });
SubcategorySchema.index({ parentCategory: 1 });
SubcategorySchema.index({ tags: 1 });
SubcategorySchema.index({ verified: 1 });
SubcategorySchema.index({ isActive: 1 });
SubcategorySchema.index({ order: 1 });

const Subcategory = mongoose.model('Subcategory', SubcategorySchema);
export default Subcategory;
