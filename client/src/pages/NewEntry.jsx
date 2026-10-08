import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export default function NewEntry() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [entryMode, setEntryMode] = useState('speak');
  const [manualText, setManualText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [formData, setFormData] = useState({
    customer: '',
    item: '',
    quantity: '',
    unit: '',
    amount: '',
    type: 'credit'
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(null);
  const { supported, listening, transcript, error: recognitionError, startListening, stopListening, setTranscript } = useSpeechRecognition();

  const refreshCustomers = async () => {
    try {
      const response = await api.getCustomers();
      setCustomers(response.customers || []);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    refreshCustomers();
  }, []);

  const currentInputText = useMemo(() => {
    if (entryMode === 'type') return manualText;
    return transcript || '';
  }, [entryMode, transcript, manualText]);

  const onFieldChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleParse = async () => {
    const textToParse = currentInputText.trim();
    if (!textToParse) {
      setError('Please enter or speak a transaction before parsing.');
      return;
    }

    setIsParsing(true);
    setError('');

    try {
      const response = await api.parseTransaction(textToParse);
      const parsed = response.data || {};
      const nextForm = {
        customer: parsed.customer || '',
        item: parsed.item || '',
        quantity: parsed.quantity ?? '',
        unit: parsed.unit || '',
        amount: parsed.amount ?? '',
        type: parsed.intent === 'payment' ? 'payment' : 'credit'
      };

      setParsedData(parsed);
      setFormData(nextForm);
      setNewCustomerName(parsed.customer || '');
      if (parsed.customer) {
        const matchedCustomer = customers.find(
          (customer) => customer.name.toLowerCase() === parsed.customer.toLowerCase()
        );
        if (matchedCustomer) {
          setSelectedCustomerId(matchedCustomer._id);
        } else {
          setSelectedCustomerId('new-customer');
        }
      }
      if (response.missingFields?.length) {
        setError(`Missing required fields: ${response.missingFields.join(', ')}`);
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not parse this entry.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const customerName = selectedCustomerId === 'new-customer'
        ? (newCustomerName || formData.customer || '').trim()
        : (formData.customer || '').trim();

      const payload = {
        customerId: selectedCustomerId && selectedCustomerId !== 'new-customer' ? selectedCustomerId : undefined,
        customerName,
        type: formData.type,
        item: formData.type === 'credit' ? formData.item : null,
        quantity: formData.type === 'credit' && formData.quantity ? Number(formData.quantity) : null,
        unit: formData.type === 'credit' ? formData.unit : null,
        amount: Number(formData.amount),
        originalText: currentInputText
      };

      if (!payload.customerName && !payload.customerId) {
        throw new Error('Customer is required.');
      }

      if (!payload.amount || Number(payload.amount) <= 0) {
        throw new Error('Amount must be greater than 0.');
      }

      const response = await api.saveTransaction(payload);
      await refreshCustomers();
      setSaveSuccess(response);
      setParsedData(null);
      setManualText('');
      setTranscript('');
      setSelectedCustomerId('');
      setNewCustomerName('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  if (saveSuccess) {
    const savedCustomerId = saveSuccess.customer?._id || saveSuccess.transaction?.customerId;
    return (
      <div className="card success-card">
        <p className="success-label">✓ Entry saved</p>
        <h2>{saveSuccess.customer?.name || formData.customer}</h2>
        <p>{formData.item ? `${formData.item} — ${formData.quantity || 1} ${formData.unit || ''}` : 'Payment'}</p>
        <p>{formatCurrency(formData.amount)} {formData.type}</p>
        <div className="button-row">
          <Link to={savedCustomerId ? `/customers/${savedCustomerId}` : '/customers'} className="primary-button">
            View Customer
          </Link>
          <Link to="/new-entry" className="secondary-button" onClick={() => setSaveSuccess(null)}>
            New Entry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-page">
      <div className="card">
        <h1>New Entry</h1>

        <label className="field-label">Customer</label>
        <select
          value={selectedCustomerId}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSelectedCustomerId(nextValue);

            if (nextValue === 'new-customer') {
              setNewCustomerName(formData.customer || '');
              return;
            }

            const matchedCustomer = customers.find((customer) => customer._id === nextValue);
            setFormData((current) => ({ ...current, customer: matchedCustomer ? matchedCustomer.name : current.customer }));
            setNewCustomerName('');
          }}
        >
          <option value="">Select customer</option>
          <option value="new-customer">+ Add new customer</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>

        {selectedCustomerId === 'new-customer' && (
          <div className="customer-name-field">
            <input
              type="text"
              value={newCustomerName}
              onChange={(event) => {
                const nextName = event.target.value;
                setNewCustomerName(nextName);
                setFormData((current) => ({ ...current, customer: nextName }));
              }}
              placeholder="Type customer name"
            />
          </div>
        )}

        <div className="mode-toggle">
          <button
            type="button"
            className={entryMode === 'speak' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setEntryMode('speak')}
          >
            🎙 Speak
          </button>
          <button
            type="button"
            className={entryMode === 'type' ? 'toggle-button active' : 'toggle-button'}
            onClick={() => setEntryMode('type')}
          >
            ⌨ Type
          </button>
        </div>

        {entryMode === 'speak' ? (
          <div className="speech-box">
            <div className="speech-actions">
              <button
                type="button"
                className={listening ? 'primary-button danger-button' : 'primary-button'}
                onClick={listening ? stopListening : startListening}
                disabled={!supported}
              >
                {listening ? 'Listening...' : 'Mic'}
              </button>
              <span className="status-pill">{listening ? 'Listening...' : supported ? 'Ready' : 'Speech not supported'}</span>
            </div>
            {recognitionError && <p className="error-text">{recognitionError}</p>}
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Speak or type your transaction here..."
              rows={4}
            />
          </div>
        ) : (
          <textarea
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            placeholder="Example: Murugan 2 kg rice 120 rupees credit"
            rows={4}
          />
        )}

        {error && <p className="error-text">{error}</p>}

        <button type="button" className="primary-button wide-button" onClick={handleParse} disabled={isParsing}>
          {isParsing ? 'Processing...' : 'Parse Entry'}
        </button>
      </div>

      {parsedData && (
        <div className="card confirmation-card">
          <h2>Please confirm</h2>

          <div className="summary-grid">
            <div className="summary-row">
              <span className="label">Customer</span>
              <input value={formData.customer} onChange={(event) => onFieldChange('customer', event.target.value)} />
            </div>
            <div className="summary-row">
              <span className="label">Item</span>
              <input value={formData.item} onChange={(event) => onFieldChange('item', event.target.value)} />
            </div>
            <div className="summary-row">
              <span className="label">Quantity</span>
              <input value={formData.quantity} onChange={(event) => onFieldChange('quantity', event.target.value)} />
            </div>
            <div className="summary-row">
              <span className="label">Unit</span>
              <input value={formData.unit} onChange={(event) => onFieldChange('unit', event.target.value)} />
            </div>
            <div className="summary-row">
              <span className="label">Amount</span>
              <input value={formData.amount} onChange={(event) => onFieldChange('amount', event.target.value)} />
            </div>
            <div className="summary-row">
              <span className="label">Type</span>
              <select value={formData.type} onChange={(event) => onFieldChange('type', event.target.value)}>
                <option value="credit">Credit</option>
                <option value="payment">Payment</option>
              </select>
            </div>
          </div>

          <div className="button-row">
            <button type="button" className="secondary-button" onClick={() => setParsedData(null)}>
              Edit
            </button>
            <button type="button" className="primary-button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
