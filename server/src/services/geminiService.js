import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION, buildUserPrompt } from '../utils/promptTemplate.js';

const normalizeParsedResponse = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    intent: payload.intent || 'unknown',
    customer: payload.customer || null,
    item: payload.item || null,
    quantity: payload.quantity !== undefined && payload.quantity !== null ? Number(payload.quantity) : null,
    unit: payload.unit || null,
    amount: payload.amount !== undefined && payload.amount !== null ? Number(payload.amount) : null
  };
};

const fallbackParser = (text) => {
  const lower = text.toLowerCase();
  const normalized = text.replace(/[\r\n]+/g, ' ').trim();

  const nameMap = {
    murugan: 'Murugan',
    ravi: 'Ravi',
    meena: 'Meena',
    kumar: 'Kumar',
    selvi: 'Selvi',
    kannan: 'Kannan',
    முருகன்: 'Murugan',
    ரவி: 'Ravi',
    மீனா: 'Meena',
    குமார்: 'Kumar',
    செல்வி: 'Selvi',
    கண்ணன்: 'Kannan'
  };

  const itemMap = {
    rice: 'rice',
    arisi: 'rice',
    அரிசி: 'rice',
    oil: 'oil',
    ennai: 'oil',
    எண்ணெய்: 'oil',
    sugar: 'sugar',
    sakkarai: 'sugar',
    சர்க்கரை: 'sugar',
    dal: 'dal',
    paruppu: 'dal',
    பருப்பு: 'dal',
    milk: 'milk',
    paal: 'milk',
    பால்: 'milk',
    soap: 'soap',
    sabun: 'soap',
    சோப்பு: 'soap',
    tea: 'tea powder',
    teapowder: 'tea powder',
    'tea powder': 'tea powder',
    powder: 'tea powder',
    தேயிலை: 'tea powder'
  };

  const customer = Object.entries(nameMap).find(([pattern]) => lower.includes(pattern))?.[1] || null;
  const itemKey = Object.entries(itemMap).find(([pattern]) => lower.includes(pattern))?.[0];
  const item = itemKey ? itemMap[itemKey] : null;

  const paymentWords = ['paid', 'pay', 'கொடுத்துட்டாரு', 'கொடுத்தார்', 'கொடுத்தேன்', 'பணம்', 'paid cash', 'rupees paid', 'காசு', 'thandharu', 'thandhenu', 'thandhaaru', 'thandha'];
  const creditWords = ['credit', 'kadan', 'கடனா', 'கடன்', 'வாங்கினேன்', 'கடனாக', 'கொடுத்தேன்', 'bought', 'purchase', 'buy', 'கேட்டாரு'];

  const hasPayment = paymentWords.some((word) => lower.includes(word));
  const hasCredit = creditWords.some((word) => lower.includes(word));

  let intent = 'unknown';
  if (hasPayment && !hasCredit) intent = 'payment';
  else if (hasCredit && !hasPayment) intent = 'credit';
  else if (hasPayment && hasCredit) intent = 'credit';

  const quantityWordMap = {
    ஒன்று: 1,
    ஒரு: 1,
    இரண்டு: 2,
    ரெண்டு: 2,
    மூன்று: 3,
    மூணு: 3,
    நான்கு: 4,
    அஞ்சு: 5,
    ஐந்து: 5,
    ஆறு: 6,
    ஏழு: 7,
    எட்டு: 8,
    ஒன்பது: 9,
    பத்து: 10,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
  };

  const quantityMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|kilogram|liter|litre|l|கிலோ|லி|லிட்டர்|packet|pack|பாக்கெட்|கோப்பை)/i);

  let quantity = null;
  if (quantityMatch) {
    const directValue = Number(quantityMatch[1]);
    if (!Number.isNaN(directValue)) {
      quantity = directValue;
    }
  }

  for (const [word, value] of Object.entries(quantityWordMap)) {
    if (lower.includes(word) && !quantity) {
      quantity = value;
      break;
    }
  }

  let amount = null;
  const amountMatch = normalized.match(/(?:rs\.?|rupees?|ரூபா|ரூபாய்|₹)\s*[:=]?\s*(\d+(?:\.\d+)?)/i)
    || normalized.match(/(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees?|ரூபா|ரூபாய்|₹)/i)
    || normalized.match(/(?:for|க்கு|கிட்ட|இடம்)\s*(\d+(?:\.\d+)?)/i)
    || normalized.match(/(\d+(?:\.\d+)?)\s*(?:credit|kadan|கடன்|கடனா)/i);

  if (amountMatch) {
    amount = Number(amountMatch[1]);
  }

  const amountWordMap = {
    நூறு: 100,
    onehundred: 100,
    hundred: 100,
    நானூறு: 900,
    இருநூறு: 200
  };

  if (amount === null) {
    for (const [word, value] of Object.entries(amountWordMap)) {
      if (lower.includes(word)) {
        amount = value;
        break;
      }
    }
  }

  let unit = null;
  if (/(?:^|\s|\d)(?:kg|kilo|kilogram|கிலோ)(?=$|\s|\d)/i.test(normalized)) unit = 'kg';
  else if (/(?:^|\s|\d)(?:liter|litre|l|லி|லிட்டர்)(?=$|\s|\d)/i.test(normalized)) unit = 'L';
  else if (/(?:^|\s|\d)(?:packet|pack|பாக்கெட்)(?=$|\s|\d)/i.test(normalized)) unit = 'packet';

  if (amount === null && intent === 'payment' && lower.includes('paid')) {
    const paymentAmount = normalized.match(/(\d+(?:\.\d+)?)/);
    if (paymentAmount) {
      amount = Number(paymentAmount[1]);
    }
  }

  return {
    intent,
    customer,
    item,
    quantity,
    unit,
    amount
  };
};

export const callGeminiParser = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return normalizeParsedResponse(fallbackParser(text));
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(text) }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    const normalized = normalizeParsedResponse(parsed);
    const fallback = fallbackParser(text);

    if (
      (normalized?.intent === 'unknown' || !normalized?.customer || normalized?.amount === null) &&
      (fallback.intent !== 'unknown' || fallback.customer || fallback.amount !== null)
    ) {
      return normalizeParsedResponse(fallback);
    }

    return normalized;
  } catch (error) {
    console.warn('Gemini parser unavailable, falling back to rule-based parser:', error.message);
    return normalizeParsedResponse(fallbackParser(text));
  }
};
