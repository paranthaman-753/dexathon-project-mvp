const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const request = async (url, options = {}) => {
  const targetUrl = `${API_BASE_URL || ''}${url}`;

  const response = await fetch(targetUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

export const api = {
  parseTransaction: (text) => request('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ text })
  }),
  getCustomers: () => request('/api/customers'),
  getCustomerById: (id) => request(`/api/customers/${id}`),
  createCustomer: (payload) => request('/api/customers', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  saveTransaction: (payload) => request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};
