import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short'
});

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    api.getCustomerById(id)
      .then((response) => {
        setCustomer(response.customer);
        setTransactions(response.transactions || []);
      })
      .catch(() => {
        setCustomer(null);
        setTransactions([]);
      });
  }, [id]);

  if (!customer) {
    return <div className="card">Loading customer...</div>;
  }

  return (
    <div className="customer-detail-page">
      <div className="card detail-summary">
        <h1>{customer.name}</h1>
        <p className="muted">Outstanding</p>
        <strong className="balance-value">{formatCurrency(customer.outstandingBalance)}</strong>
      </div>

      <div className="card">
        <h2>Transaction History</h2>
        <div className="history-list">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="history-item">
              <div>
                <div className="history-date">{formatDate(transaction.createdAt)}</div>
                {transaction.type === 'credit' ? (
                  <div>
                    {transaction.item || 'Credit'} — {transaction.quantity || 1} {transaction.unit || ''}
                  </div>
                ) : (
                  <div>Payment</div>
                )}
              </div>
              <div className={`history-amount ${transaction.type === 'credit' ? 'credit' : 'payment'}`}>
                {formatCurrency(transaction.amount)} {transaction.type === 'credit' ? 'Credit' : 'Payment'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
