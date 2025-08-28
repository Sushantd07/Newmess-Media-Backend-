// models/StructuredComplaints.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const ContactInfoSchema = new Schema({
  phoneNumbers: [String],
  emailAddresses: [String],
  websites: [{
    title: String,
    url: String
  }]
});

const StepSchema = new Schema({
  stepNumber: Number,
  title: String,
  description: String,
  details: [String]
});

const MethodSchema = new Schema({
  methodNumber: Number,
  title: String,
  description: String,
  steps: [StepSchema],
  contactInfo: ContactInfoSchema
});

const LevelSchema = new Schema({
  levelNumber: Number,
  title: String,
  description: String,
  contactDetails: ContactInfoSchema
});

const TimelineSchema = new Schema({
  level: String,
  days: String,
  description: String
});

const HeadingSchema = new Schema({
  text: String,
  subText: String
});

const StructuredComplaintsSchema = new Schema(
  {
    // Reference to company page
    companyPageId: { 
      type: Schema.Types.ObjectId, 
      ref: "Subcategory", 
      required: true 
    },
    
    // Main heading information (simplified)
    mainHeading: {
      title: String,
      description: String
    },
    
    // Rich text content (original Word document content) - MAIN CONTENT
    richTextContent: String,
    
    // Processing metadata
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'error'],
      default: 'completed'
    },
    
    processingErrors: [String],
    
    // Version tracking
    version: {
      type: Number,
      default: 1
    },
    
    // Last processed timestamp
    lastProcessed: Date,
    
    // Source document info (optional)
    sourceDocument: {
      originalContent: String,
      processedAt: Date,
      wordCount: Number,
      structureExtracted: Boolean
    }
  },
  { 
    timestamps: true,
    // Indexes for better query performance
    indexes: [
      { companyPageId: 1 },
      { processingStatus: 1 },
      { 'mainHeading.title': 'text', 'richTextContent': 'text' }
    ]
  }
);

// Pre-save middleware to update processing metadata
StructuredComplaintsSchema.pre('save', function(next) {
  if (this.isModified('richTextContent') || this.isModified('complaintMethods') || this.isModified('escalationLevels')) {
    this.lastProcessed = new Date();
    this.processingStatus = 'completed';
    this.version += 1;
  }
  next();
});

// Static method to find by company page
StructuredComplaintsSchema.statics.findByCompanyPage = function(companyPageId) {
  return this.findOne({ companyPageId }).sort({ version: -1 });
};

// Instance method to get structured summary
StructuredComplaintsSchema.methods.getSummary = function() {
  return {
    mainHeading: this.mainHeading?.title || 'No heading',
    contentLength: this.richTextContent?.length || 0,
    processingStatus: this.processingStatus,
    lastUpdated: this.updatedAt
  };
};

// Instance method to validate structure
StructuredComplaintsSchema.methods.validateStructure = function() {
  const errors = [];
  
  if (!this.richTextContent) {
    errors.push('Rich text content is required');
  }
  
  if (!this.mainHeading?.title) {
    errors.push('Main heading title is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default mongoose.model("StructuredComplaints", StructuredComplaintsSchema); 