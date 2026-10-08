import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.getCustomers().then((response) => setCustomers(response.customers || [])).catch(() => setCustomers([]));
  }, []);

  return (
    <div className="customers-page">
      <div className="section-header">
        <h1>Customers</h1>
      </div>

      <div className="customer-grid">
        {customers.map((customer) => (
          <Link key={customer._id} to={`/customers/${customer._id}`} className="customer-card card">
            <h3>{customer.name}</h3>
            <p className="muted">Outstanding</p>
            <strong>{formatCurrency(customer.outstandingBalance)}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
