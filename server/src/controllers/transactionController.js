import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createTransaction = async (req, res) => {
  try {
    let { customerId, customerName, type, item, quantity, unit, amount, originalText } = req.body;

    if (!type || !['credit', 'payment'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be credit or payment.' });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount greater than 0 is required.' });
    }

    let customerDoc;
    if (customerId) {
      customerDoc = await Customer.findById(customerId);
    } else if (customerName) {
      customerDoc = await Customer.findOne({
        name: new RegExp(`^${escapeRegex(String(customerName).trim())}$`, 'i')
      });
      if (!customerDoc) {
        customerDoc = await Customer.create({
          name: String(customerName).trim(),
          phone: ''
        });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Customer identifier or name required.' });
    }

    const transaction = await Transaction.create({
      customerId: customerDoc._id,
      customerName: customerDoc.name,
      type,
      item: type === 'credit' ? item || null : null,
      quantity: type === 'credit' && quantity ? Number(quantity) : null,
      unit: type === 'credit' ? unit || null : null,
      amount: Number(amount),
      originalText: originalText || ''
    });

    return res.status(201).json({
      success: true,
      transaction,
      customer: customerDoc
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
