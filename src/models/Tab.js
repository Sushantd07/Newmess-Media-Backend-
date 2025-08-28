import mongoose from 'mongoose';

const tabSchema = new mongoose.Schema({
  // Tab identifier (shared across companies)
  tabId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Tab metadata (shared across companies)
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  label: {
    type: String,
    required: true,
    trim: true
  },
  
  icon: {
    type: String,
    default: 'FileText'
  },
  
  type: {
    type: String,
    enum: ['custom', 'system'],
    default: 'custom'
  },
  
  // Tab order (company-specific)
  order: {
    type: Number,
    default: 0
  },
  
  // Company-specific content
  companyContent: {
    type: Map,
    of: {
      content: {
        type: String,
        default: ''
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    default: new Map()
  },
  
  // Tab settings (shared)
  settings: {
    isVisible: {
      type: Boolean,
      default: true
    },
    requiresAuth: {
      type: Boolean,
      default: false
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'admin']
    }]
  },
  
  // Metadata
  createdBy: {
    type: String,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
tabSchema.index({ type: 1 });
tabSchema.index({ 'companyContent.companyId': 1 });

// Virtual for getting company-specific content
tabSchema.virtual('getCompanyContent').get(function(companyId) {
  return this.companyContent.get(companyId) || {
    content: '',
    lastUpdated: new Date(),
    isActive: true
  };
});

// Method to set company-specific content
tabSchema.methods.setCompanyContent = function(companyId, content) {
  this.companyContent.set(companyId, {
    content: content,
    lastUpdated: new Date(),
    isActive: true
  });
  return this.save();
};

// Method to get all companies using this tab
tabSchema.methods.getCompaniesUsingTab = function() {
  return Array.from(this.companyContent.keys());
};

// Static method to find tabs by company
tabSchema.statics.findByCompany = function(companyId) {
  return this.find({
    $or: [
      { 'companyContent.companyId': companyId },
      { type: 'system' }
    ]
  }).sort({ order: 1 });
};

// Static method to create a new tab
tabSchema.statics.createTab = function(tabData, companyId) {
  const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const tab = new this({
    tabId,
    name: tabData.name,
    label: tabData.label,
    icon: tabData.icon || 'FileText',
    type: 'custom',
    createdBy: companyId,
    order: tabData.order || 0
  });
  
  // Set initial company content
  if (tabData.content) {
    tab.setCompanyContent(companyId, tabData.content);
  }
  
  return tab.save();
};

const Tab = mongoose.model('Tab', tabSchema);

export default Tab;
