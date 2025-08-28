import ContactNumbersTab from '../models/tabs/ContactNumbers.tabs.js';
import ComplaintsTab from '../models/tabs/Complaint.tabs.js';
import QuickHelpTab from '../models/tabs/QuickHelp.tabs.js';
import OverviewTab from '../models/tabs/OverviewTabs.js';
import VideoGuideTab from '../models/tabs/VideoGuide.tabs.js';

// ==================== CONTACT NUMBERS TAB ====================

export const createContactNumbersTab = async (req, res) => {
  try {
    const contactNumbersTab = await ContactNumbersTab.create(req.body);
    res.status(201).json({ success: true, data: contactNumbersTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getAllContactNumbersTab = async (req, res) => {
  try {
    // Get the first contact numbers tab, or create a default one if none exist
    let contactNumbersTab = await ContactNumbersTab.findOne();
    
    if (!contactNumbersTab) {
      // Create a default contact numbers tab with the data you provided
      contactNumbersTab = await ContactNumbersTab.create({
        tabTitle: "HDFC Contact Numbers",
        tabDescription: "All toll-free numbers, helpline details, SMS services, and quick links for HDFC Bank.",
        topContactCards: {
          heading: {
            key: "topCards",
            text: "Top Contact Cards"
          },
          cards: [
            {
              title: "HDFC Phone Banking",
              number: "1800 2600",
              subtitle: "Toll-free • 24x7",
              icon: "PhoneCall",
              colors: {
                cardBg: "#D0E7FF",
                iconBg: "#A8D8FF",
                textColor: "#16a34a"
              }
            },
            {
              title: "Alternate Phone Banking",
              number: "1800 1600",
              subtitle: "Block instantly • 24x7",
              icon: "AlertCircle",
              colors: {
                cardBg: "#FFEAEA",
                iconBg: "#FFCCCC",
                textColor: "#e11d48"
              }
            },
            {
              title: "Account/Loan Assistance",
              number: "1800 266 3310",
              subtitle: "Support • 10 AM – 5 PM",
              icon: "CreditCard",
              colors: {
                cardBg: "#F5E9FF",
                iconBg: "#E6D7FF",
                textColor: "#9333ea"
              }
            },
            {
              title: "WhatsApp Banking",
              number: "70700 22222",
              subtitle: "Report fraud • 24x7",
              icon: "Shield",
              colors: {
                cardBg: "#FFF9E5",
                iconBg: "#FFF2B8",
                textColor: "#ca8a04"
              }
            }
          ]
        },
        nationalNumbersSection: {
          heading: {
            key: "nationalNumbers",
            text: "National Contact Numbers"
          },
          items: [
            {
              type: "Customer Care",
              number: "1800-258-6161",
              description: "General banking support and account inquiries",
              available: "24x7",
              languages: ["Hindi", "English", "Regional Languages"],
              avgWaitTime: "1-2 minutes"
            },
            {
              type: "Credit Card Support",
              number: "1800-266-4332",
              description: "Credit card related queries and support",
              available: "24x7",
              languages: ["Hindi", "English"],
              avgWaitTime: "2-3 minutes"
            },
            {
              type: "Phone Banking",
              number: "1800-2600",
              description: "Phone banking services and transactions",
              available: "24x7",
              languages: ["Hindi", "English"],
              avgWaitTime: "1-2 minutes"
            },
            {
              type: "Alternate Phone Banking",
              number: "1800-1600",
              description: "Alternative phone banking number",
              available: "24x7",
              languages: ["Hindi", "English"],
              avgWaitTime: "1-2 minutes"
            },
            {
              type: "Account/Loan Assistance",
              number: "1800-266-3310",
              description: "Account and loan related assistance",
              available: "10 AM – 5 PM",
              languages: ["Hindi", "English"],
              avgWaitTime: "2-3 minutes"
            },
            {
              type: "WhatsApp Banking",
              number: "70700-22222",
              description: "WhatsApp banking services",
              available: "24x7",
              languages: ["Hindi", "English"],
              avgWaitTime: "Instant"
            }
          ]
        },
        stateWiseNumbersSection: {
          heading: {
            key: "stateWiseNumbers",
            text: "State-wise Contact Numbers"
          },
          states: [
            {
              state: "Maharashtra",
              offices: [
                {
                  city: "Mumbai",
                  number: "022-6171-2000",
                  type: "Head Office"
                },
                {
                  city: "Pune",
                  number: "020-6666-8888",
                  type: "Regional Office"
                },
                {
                  city: "Nagpur",
                  number: "0712-666-9999",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Delhi",
              offices: [
                {
                  city: "New Delhi",
                  number: "011-6666-1111",
                  type: "Regional Office"
                },
                {
                  city: "Gurgaon",
                  number: "0124-666-2222",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Karnataka",
              offices: [
                {
                  city: "Bangalore",
                  number: "080-6666-3333",
                  type: "Regional Office"
                },
                {
                  city: "Mysore",
                  number: "0821-666-4444",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Tamil Nadu",
              offices: [
                {
                  city: "Chennai",
                  number: "044-6666-5555",
                  type: "Regional Office"
                },
                {
                  city: "Coimbatore",
                  number: "0422-666-6666",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Gujarat",
              offices: [
                {
                  city: "Ahmedabad",
                  number: "079-6666-7777",
                  type: "Regional Office"
                },
                {
                  city: "Surat",
                  number: "0261-666-8888",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "West Bengal",
              offices: [
                {
                  city: "Kolkata",
                  number: "033-6666-9999",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Uttar Pradesh",
              offices: [
                {
                  city: "Lucknow",
                  number: "0522-666-1111",
                  type: "Regional Office"
                },
                {
                  city: "Kanpur",
                  number: "0512-666-2222",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Telangana",
              offices: [
                {
                  city: "Hyderabad",
                  number: "040-6666-3333",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Andhra Pradesh",
              offices: [
                {
                  city: "Vijayawada",
                  number: "0866-666-4444",
                  type: "Regional Office"
                }
              ]
            },
            {
              state: "Kerala",
              offices: [
                {
                  city: "Kochi",
                  number: "0484-666-5555",
                  type: "Regional Office"
                }
              ]
            }
          ]
        },
        helplineNumbersSection: {
          heading: {
            key: "helpline",
            text: "Helpline Numbers"
          },
          table: {
            headers: ["Service", "Number", "Timings"],
            rows: [
              ["Account Balance", "1800 270 3333", "24x7"],
              ["Fraud/Transaction Blocking", "1800 258 6161", "10 AM – 5 PM"],
              ["Mini Statement", "1800 270 3355", "24x7"],
              ["Credit Card Support", "1800 266 4332", "24x7"],
              ["Phone Banking", "1800 2600", "24x7"],
              ["WhatsApp Banking", "70700 22222", "24x7"]
            ]
          }
        },
        allIndiaNumbersSection: {
          heading: {
            key: "allIndia",
            text: "All India Numbers"
          },
          table: {
            headers: ["Number", "Description"],
            rows: [
              ["1860 266 0333", "Generate New Credit Card PIN"],
              ["72900 30000", "Report Fraud via WhatsApp"],
              ["1800 258 6161", "Customer Care (24x7)"],
              ["1800 266 4332", "Credit Card Support (24x7)"],
              ["1800 2600", "Phone Banking (24x7)"],
              ["1800 1600", "Alternate Phone Banking (24x7)"],
              ["1800 266 3310", "Account/Loan Assistance (10 AM-5 PM)"],
              ["70700 22222", "WhatsApp Banking (24x7)"]
            ]
          }
        },
        smsServicesSection: {
          heading: {
            key: "smsServices",
            text: "SMS & WhatsApp Services"
          },
          services: [
            { code: "BAL", description: "Check account balance", number: "5676712" },
            { code: "MINI", description: "Get mini statement", number: "5676712" },
            { code: "CHQBOOK", description: "Request cheque book", number: "5676712" },
            { code: "STOP", description: "Stop cheque payment", number: "5676712" },
            { code: "BLOCK", description: "Block debit card", number: "5676712" },
            { code: "PIN", description: "Generate ATM PIN", number: "5676712" }
          ]
        },
        ivrMenuSection: {
          heading: {
            key: "ivrMenu",
            text: "IVRS Menu Guide"
          },
          description: "After selecting preferred language: Hindi, English, Marathi",
          menus: [
            {
              title: "Main Menu (1800-2600)",
              options: [
                {
                  option: "1",
                  description: "Account Balance & Statement",
                  subOptions: [
                    {
                      option: "1",
                      description: "Balance Enquiry"
                    },
                    {
                      option: "2",
                      description: "Mini Statement"
                    }
                  ]
                },
                {
                  option: "2",
                  description: "Fund Transfer & Payment",
                  subOptions: [
                    {
                      option: "1",
                      description: "Block Card"
                    },
                    {
                      option: "2",
                      description: "Card Limit Enquiry"
                    }
                  ]
                },
                {
                  option: "3",
                  description: "Card Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "Debit card blocking and replacement"
                    },
                    {
                      option: "2",
                      description: "Block UPI services"
                    }
                  ]
                },
                {
                  option: "4",
                  description: "Loan Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "Generate ATM Pin"
                    },
                    {
                      option: "2",
                      description: "Generate T-pin"
                    }
                  ]
                },
                {
                  option: "5",
                  description: "Fixed Deposit Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "FD Information"
                    },
                    {
                      option: "2",
                      description: "FD Renewal"
                    }
                  ]
                },
                {
                  option: "6",
                  description: "Complaint Registration",
                  subOptions: []
                }
              ]
            },
            {
              title: "Credit Card Menu (1800-266-4332)",
              options: [
                {
                  option: "1",
                  description: "Credit Card Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "Card Balance"
                    },
                    {
                      option: "2",
                      description: "Card Statement"
                    }
                  ]
                },
                {
                  option: "2",
                  description: "Card Activation",
                  subOptions: [
                    {
                      option: "1",
                      description: "Activate Card"
                    },
                    {
                      option: "2",
                      description: "Set PIN"
                    }
                  ]
                },
                {
                  option: "3",
                  description: "Card Blocking",
                  subOptions: [
                    {
                      option: "1",
                      description: "Block Card"
                    },
                    {
                      option: "2",
                      description: "Report Fraud"
                    }
                  ]
                }
              ]
            },
            {
              title: "Loan Services Menu (1800-266-3310)",
              options: [
                {
                  option: "1",
                  description: "Loan Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "Loan Balance"
                    },
                    {
                      option: "2",
                      description: "Loan Statement"
                    }
                  ]
                },
                {
                  option: "2",
                  description: "EMI Services",
                  subOptions: [
                    {
                      option: "1",
                      description: "EMI Schedule"
                    },
                    {
                      option: "2",
                      description: "Pay EMI"
                    }
                  ]
                },
                {
                  option: "3",
                  description: "Foreclosure",
                  subOptions: [
                    {
                      option: "1",
                      description: "Foreclosure Quote"
                    }
                  ]
                }
              ]
            }
          ]
        },
        quickLinksSection: {
          heading: {
            key: "quickLinks",
            text: "Quick Links"
          },
          links: [
            {
              title: "HDFC NetBanking Login",
              url: "https://netbanking.hdfcbank.com/netbanking/",
              description: "Daily banking transactions",
              icon: "🏦",
              iconBg: "bg-blue-100 text-blue-700",
              priority: "most-used"
            },
            {
              title: "Find HDFC Branch/ATM",
              url: "https://near-me.hdfcbank.com/branch-atm-locator/",
              description: "Location-based searches",
              icon: "📍",
              iconBg: "bg-blue-100 text-blue-700",
              priority: "most-used"
            }
          ]
        },
        emailSupportSection: {
          heading: {
            key: "emailSupport",
            text: "Email Support"
          },
          table: {
            headers: ["Service", "Email"],
            rows: [
              ["Credit Card Customer Support", "customerservices.cards@hdfcbank.com"],
              ["Credit Card Complaints & Mis-selling Issues", "salesqueriescards@hdfcbank.com"],
              ["Report Unauthorized PayZapp Transactions", "cybercell@payzapp.in"],
              ["Loan Enquiries & Support", "loansupport@hdfcbank.com"],
              ["Retail Banking, ATM/Debit Cards & Mutual Funds Support", "dphelp@hdfcbank.com"]
            ]
          }
        },
        nriPhoneBankingSection: {
          heading: {
            key: "nriPhoneBanking",
            text: "NRI Phone Banking Support"
          },
          subsections: [
            {
              title: "Existing Account Holder Queries (24x7)",
              table: {
                headers: ["Sr No.", "Country", "Contact Number"],
                rows: [
                  ["1", "USA", "855-999-6061"],
                  ["2", "Canada", "855-999-6061"],
                  ["3", "Singapore", "800-101-2850"],
                  ["4", "Kenya", "0-800-721-740"],
                  ["5", "Other Countries", "91-2260006000"]
                ]
              }
            },
            {
              title: "NRI Account Opening Assistance (Toll Free)",
              table: {
                headers: ["Sr No.", "Country", "Contact Number"],
                rows: [
                  ["1", "USA", "855-207-8106"],
                  ["2", "Canada", "855-846-3731"],
                  ["3", "UK", "800-756-2993"],
                  ["4", "Singapore", "800-101-2798"]
                ]
              }
            }
          ]
        },
        missedCallServiceSection: {
          heading: {
            key: "missedCallService",
            text: "Missed Call Service"
          },
          table: {
            headers: ["Sr No.", "Service Name", "Contact No."],
            rows: [
              ["1", "Get Mini Statement", "1800 270 3355"],
              ["2", "Request Cheque Book", "1800 270 3366"],
              ["3", "Debit Card EMI Support", "96432 22222"],
              ["4", "Relationship Manager (RM) Contact", "70433 70433"]
            ]
          }
        },
        customerCareListSection: {
          heading: {
            key: "customerCareList",
            text: "Customer Care List"
          },
          links: [
            { name: "SBI Customer Care", href: "/category/banking/private-banks/sbi-bank/contactnumber" },
            { name: "Axis Bank Customer Care", href: "/category/banking/private-banks/axis-bank/contactnumber" },
            { name: "ICICI Bank Customer Care", href: "/category/banking/private-banks/icici-bank/contactnumber" },
            { name: "Kotak Mahindra Bank Customer Care", href: "/category/banking/private-banks/kotak-bank/contactnumber" },
            { name: "Punjab National Bank Customer Care", href: "/category/banking/public-banks/pnb-bank/contactnumber" },
            { name: "Canara Bank Customer Care", href: "/category/banking/public-banks/canara-bank/contactnumber" },
            { name: "Bank of India Customer Care", href: "/category/banking/public-banks/bank-of-india/contactnumber" },
            { name: "Union Bank of India Customer Care", href: "/category/banking/private-banks/union-bank/contactnumber" }
          ]
        },
        additionalTables: [
          {
            heading: {
              key: "missedCall",
              text: "Missed Call Service"
            },
            table: {
              headers: ["Service", "Contact No."],
              rows: [
                ["For Balance Enquiry", "9223766666"],
                ["For Mini Statement", "9223866666"],
                ["For Home Loan", "7208933140"]
              ]
            }
          },
          {
            heading: {
              key: "otherEmails",
              text: "Other Emails"
            },
            table: {
              headers: ["Service", "Email Address"],
              rows: [
                ["General Head", "socialreply@sbi.co.in, gm.customer@sbi.co.in"],
                ["Aadhaar Seeding", "nodalofficer.aadhaarseeding@sbi.co.in"],
                ["Home Loan", "customercare.homeloans@sbi.co.in"]
              ]
            }
          }
        ]
      });
    }
    
    res.status(200).json({ success: true, data: contactNumbersTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getContactNumbersTab = async (req, res) => {
  try {
    const { id } = req.params;
    const contactNumbersTab = await ContactNumbersTab.findById(id);
    
    if (!contactNumbersTab) {
      return res.status(404).json({ success: false, message: 'Contact numbers tab not found' });
    }
    
    res.status(200).json({ success: true, data: contactNumbersTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateContactNumbersTab = async (req, res) => {
  try {
    const { id } = req.params;
    const contactNumbersTab = await ContactNumbersTab.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!contactNumbersTab) {
      return res.status(404).json({ success: false, message: 'Contact numbers tab not found' });
    }
    
    res.status(200).json({ success: true, data: contactNumbersTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==================== COMPLAINTS TAB ====================

export const createComplaintsTab = async (req, res) => {
  try {
    const complaintsTab = await ComplaintsTab.create(req.body);
    res.status(201).json({ success: true, data: complaintsTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getComplaintsTab = async (req, res) => {
  try {
    const { id } = req.params;
    const complaintsTab = await ComplaintsTab.findById(id);
    
    if (!complaintsTab) {
      return res.status(404).json({ success: false, message: 'Complaints tab not found' });
    }
    
    res.status(200).json({ success: true, data: complaintsTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateComplaintsTab = async (req, res) => {
  try {
    const { id } = req.params;
    const complaintsTab = await ComplaintsTab.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!complaintsTab) {
      return res.status(404).json({ success: false, message: 'Complaints tab not found' });
    }
    
    res.status(200).json({ success: true, data: complaintsTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==================== QUICK HELP TAB ====================

export const createQuickHelpTab = async (req, res) => {
  try {
    const quickHelpTab = await QuickHelpTab.create(req.body);
    res.status(201).json({ success: true, data: quickHelpTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getQuickHelpTab = async (req, res) => {
  try {
    const { id } = req.params;
    const quickHelpTab = await QuickHelpTab.findById(id);
    
    if (!quickHelpTab) {
      return res.status(404).json({ success: false, message: 'Quick help tab not found' });
    }
    
    res.status(200).json({ success: true, data: quickHelpTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateQuickHelpTab = async (req, res) => {
  try {
    const { id } = req.params;
    const quickHelpTab = await QuickHelpTab.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!quickHelpTab) {
      return res.status(404).json({ success: false, message: 'Quick help tab not found' });
    }
    
    res.status(200).json({ success: true, data: quickHelpTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==================== OVERVIEW TAB ====================

export const createOverviewTab = async (req, res) => {
  try {
    const overviewTab = await OverviewTab.create(req.body);
    res.status(201).json({ success: true, data: overviewTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getOverviewTab = async (req, res) => {
  try {
    const { id } = req.params;
    const overviewTab = await OverviewTab.findById(id);
    
    if (!overviewTab) {
      return res.status(404).json({ success: false, message: 'Overview tab not found' });
    }
    
    res.status(200).json({ success: true, data: overviewTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateOverviewTab = async (req, res) => {
  try {
    const { id } = req.params;
    const overviewTab = await OverviewTab.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!overviewTab) {
      return res.status(404).json({ success: false, message: 'Overview tab not found' });
    }
    
    res.status(200).json({ success: true, data: overviewTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==================== VIDEO GUIDE TAB ====================

export const createVideoGuideTab = async (req, res) => {
  try {
    const videoGuideTab = await VideoGuideTab.create(req.body);
    res.status(201).json({ success: true, data: videoGuideTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const getVideoGuideTab = async (req, res) => {
  try {
    const { id } = req.params;
    const videoGuideTab = await VideoGuideTab.findById(id);
    
    if (!videoGuideTab) {
      return res.status(404).json({ success: false, message: 'Video guide tab not found' });
    }
    
    res.status(200).json({ success: true, data: videoGuideTab });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateVideoGuideTab = async (req, res) => {
  try {
    const { id } = req.params;
    const videoGuideTab = await VideoGuideTab.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!videoGuideTab) {
      return res.status(404).json({ success: false, message: 'Video guide tab not found' });
    }
    
    res.status(200).json({ success: true, data: videoGuideTab });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ==================== GENERIC DELETE FUNCTIONS ====================

export const deleteTab = async (req, res) => {
  try {
    const { id, tabType } = req.params;
    
    let TabModel;
    switch (tabType) {
      case 'contact-numbers':
        TabModel = ContactNumbersTab;
        break;
      case 'complaints':
        TabModel = ComplaintsTab;
        break;
      case 'quick-help':
        TabModel = QuickHelpTab;
        break;
      case 'overview':
        TabModel = OverviewTab;
        break;
      case 'video-guide':
        TabModel = VideoGuideTab;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid tab type' });
    }
    
    const tab = await TabModel.findByIdAndDelete(id);
    
    if (!tab) {
      return res.status(404).json({ success: false, message: 'Tab not found' });
    }
    
    res.status(200).json({ success: true, message: 'Tab deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 