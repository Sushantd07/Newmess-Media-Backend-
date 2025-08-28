import express from 'express';
import ContactNumbers from '../models/ContactNumbers.js';

const router = express.Router();

// GET all contact numbers
router.get('/', async (req, res) => {
  try {
    const { companySlug } = req.query;
    const query = companySlug ? { companySlug } : {};
    const contactNumbers = await ContactNumbers.findOne(query).sort({ createdAt: -1 });
    res.json(contactNumbers || {});
  } catch (error) {
    console.error('Error fetching contact numbers:', error);
    res.status(500).json({ message: 'Error fetching contact numbers' });
  }
});

// POST new contact numbers
router.post('/', async (req, res) => {
  try {
    const contactNumbersData = req.body;
    
    // Create new contact numbers document
    const contactNumbers = new ContactNumbers({
      companySlug: contactNumbersData.companySlug,
      helpline: contactNumbersData.helpline || [],
      allIndia: contactNumbersData.allIndia || [],
      smsServices: contactNumbersData.smsServices || [],
      ivrsMenu: contactNumbersData.ivrsMenu || [],
      emailSupport: contactNumbersData.emailSupport || [],
      nriPhoneBanking: contactNumbersData.nriPhoneBanking || [],
      missedCallService: contactNumbersData.missedCallService || []
    });

    await contactNumbers.save();
    res.status(201).json({ message: 'Contact numbers saved successfully', data: contactNumbers });
  } catch (error) {
    console.error('Error saving contact numbers:', error);
    res.status(500).json({ message: 'Error saving contact numbers' });
  }
});

// PUT update contact numbers
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contactNumbersData = req.body;
    
    const updatedContactNumbers = await ContactNumbers.findByIdAndUpdate(
      id,
      {
        companySlug: contactNumbersData.companySlug,
        helpline: contactNumbersData.helpline || [],
        allIndia: contactNumbersData.allIndia || [],
        smsServices: contactNumbersData.smsServices || [],
        ivrsMenu: contactNumbersData.ivrsMenu || [],
        emailSupport: contactNumbersData.emailSupport || [],
        nriPhoneBanking: contactNumbersData.nriPhoneBanking || [],
        missedCallService: contactNumbersData.missedCallService || []
      },
      { new: true }
    );

    if (!updatedContactNumbers) {
      return res.status(404).json({ message: 'Contact numbers not found' });
    }

    res.json({ message: 'Contact numbers updated successfully', data: updatedContactNumbers });
  } catch (error) {
    console.error('Error updating contact numbers:', error);
    res.status(500).json({ message: 'Error updating contact numbers' });
  }
});

// DELETE entire section for a company
router.delete('/:companySlug/section/:sectionKey', async (req, res) => {
  try {
    const { companySlug, sectionKey } = req.params;
    const doc = await ContactNumbers.findOne({ companySlug });
    if (!doc) return res.status(404).json({ message: 'Contact numbers not found' });
    if (!doc[sectionKey]) return res.status(400).json({ message: 'Invalid section key' });
    doc[sectionKey] = [];
    await doc.save();
    res.json({ message: 'Section cleared', data: doc });
  } catch (error) {
    console.error('Error clearing section:', error);
    res.status(500).json({ message: 'Error clearing section' });
  }
});

// Upsert full structured payload for a company (non-coder friendly)
router.put('/:companySlug', async (req, res) => {
  try {
    const { companySlug } = req.params;
    const payload = req.body || {};
    const update = { companySlug, ...payload };
    const doc = await ContactNumbers.findOneAndUpdate(
      { companySlug },
      update,
      { upsert: true, new: true }
    );
    res.json({ message: 'Saved', data: doc });
  } catch (error) {
    console.error('Error upserting contact numbers:', error);
    res.status(500).json({ message: 'Error saving contact numbers' });
  }
});

export default router;


