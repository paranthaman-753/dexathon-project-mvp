import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Customer from './src/models/Customer.js';
import Transaction from './src/models/Transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pesum_kanakku';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    await Customer.deleteMany({});
    await Transaction.deleteMany({});

    const customers = await Customer.insertMany([
      { name: 'Murugan', phone: '9876543210' },
      { name: 'Ravi', phone: '9876543211' },
      { name: 'Meena', phone: '9876543212' },
      { name: 'Kumar', phone: '9876543213' },
      { name: 'Selvi', phone: '9876543214' }
    ]);

    console.log(`Seeded ${customers.length} customers.`);

    const murugan = customers.find((customer) => customer.name === 'Murugan');
    const ravi = customers.find((customer) => customer.name === 'Ravi');

    await Transaction.insertMany([
      {
        customerId: murugan._id,
        customerName: murugan.name,
        type: 'credit',
        item: 'Rice',
        quantity: 10,
        unit: 'kg',
        amount: 600,
        originalText: 'Murugan 10kg rice credit 600'
      },
      {
        customerId: murugan._id,
        customerName: murugan.name,
        type: 'credit',
        item: 'Oil',
        quantity: 2,
        unit: 'L',
        amount: 360,
        originalText: 'Murugan 2L oil credit 360'
      },
      {
        customerId: murugan._id,
        customerName: murugan.name,
        type: 'payment',
        amount: 200,
        originalText: 'Murugan paid 200 rupees'
      },
      {
        customerId: ravi._id,
        customerName: ravi.name,
        type: 'credit',
        item: 'Sugar',
        quantity: 3,
        unit: 'kg',
        amount: 150,
        originalText: 'Ravi 3kg sugar credit 150'
      }
    ]);

    console.log('Seeded sample transactions.');
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
