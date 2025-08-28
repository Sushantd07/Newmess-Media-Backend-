import mongoose from 'mongoose';

const contactNumbersSchema = new mongoose.Schema({
  companySlug: { type: String, required: true, index: true },
  // Flexible structured payload following Backend/src/models/common/Common.js
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  helpline: [{
    service: { type: String, required: true },
    number: { type: String, required: true },
    available: { type: String, default: "24x7 Available" }
  }],
  allIndia: [{
    number: { type: String, required: true },
    description: { type: String, required: true },
    availability: { type: String, default: "24x7" }
  }],
  smsServices: [{
    command: { type: String, required: true },
    number: { type: String, required: true },
    description: { type: String, required: true }
  }],
  ivrsMenu: [{
    option: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    subOptions: [{
      option: { type: String, required: true },
      title: { type: String, required: true },
      action: { type: String, required: true }
    }]
  }],
  emailSupport: [{
    service: { type: String, required: true },
    email: { type: String, required: true },
    response: { type: String, default: "Within 24 hours" }
  }],
  nriPhoneBanking: [{
    country: { type: String, required: true },
    number: { type: String, required: true },
    service: { type: String, default: "Existing Account Holder Queries" }
  }],
  missedCallService: [{
    service: { type: String, required: true },
    number: { type: String, required: true },
    description: { type: String, required: true }
  }]
}, {
  timestamps: true
});

export default mongoose.model('ContactNumbers', contactNumbersSchema);


