import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

customerSchema.virtual('displayName').get(function () {
  return this.name ? this.name.charAt(0).toUpperCase() + this.name.slice(1) : '';
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
