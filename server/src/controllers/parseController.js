import { parseTransactionText } from '../services/parserService.js';

export const handleParse = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text field is required.' });
    }

    const result = await parseTransactionText(text);
    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: result.error || 'Could not parse transaction string.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      missingFields: result.missingFields
    });
  } catch (error) {
    console.error('Parse controller error:', error);
    return res.status(500).json({ success: false, error: 'Internal parser server error' });
  }
};
