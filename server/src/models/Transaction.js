import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['credit', 'payment'],
      required: true
    },
    item: {
      type: String,
      default: null
    },
    quantity: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    originalText: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
