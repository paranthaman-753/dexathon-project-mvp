import { callGeminiParser } from './geminiService.js';

export const parseTransactionText = async (text) => {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'Empty or invalid input text provided.'
    };
  }

  try {
    const aiResult = await callGeminiParser(text.trim());

    const normalizedResult = {
      intent: aiResult?.intent || 'unknown',
      customer: aiResult?.customer || null,
      item: aiResult?.item || null,
      quantity: aiResult?.quantity ?? null,
      unit: aiResult?.unit || null,
      amount: aiResult?.amount ?? null
    };

    const missingFields = [];
    if (!normalizedResult.intent || normalizedResult.intent === 'unknown') {
      missingFields.push('intent');
    }
    if (!normalizedResult.customer) {
      missingFields.push('customer');
    }
    if (normalizedResult.amount === null || normalizedResult.amount === undefined) {
      missingFields.push('amount');
    }

    return {
      success: true,
      data: normalizedResult,
      missingFields
    };
  } catch (error) {
    console.error('Parser service error:', error.message);
    return {
      success: false,
      error: error.message || 'AI parsing failed to evaluate text.'
    };
  }
};
