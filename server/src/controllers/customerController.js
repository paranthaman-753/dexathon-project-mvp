import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 }).lean();

    const customerList = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({ customerId: customer._id }).lean();
        const outstandingBalance = transactions.reduce((total, tx) => {
          if (tx.type === 'credit') return total + tx.amount;
          if (tx.type === 'payment') return total - tx.amount;
          return total;
        }, 0);

        return {
          ...customer,
          outstandingBalance
        };
      })
    );

    return res.status(200).json({ success: true, customers: customerList });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const transactions = await Transaction.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean();
    const totalCredit = transactions
      .filter((tx) => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalPayment = transactions
      .filter((tx) => tx.type === 'payment')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const outstandingBalance = totalCredit - totalPayment;

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        outstandingBalance,
        totalCredit,
        totalPayment
      },
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required.' });
    }

    const trimmedName = String(name).trim();
    const existingCustomer = await Customer.findOne({
      name: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i')
    });

    if (existingCustomer) {
      return res.status(200).json({ success: true, customer: existingCustomer });
    }

    const customer = await Customer.create({
      name: trimmedName,
      phone: phone || ''
    });

    return res.status(201).json({ success: true, customer });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
