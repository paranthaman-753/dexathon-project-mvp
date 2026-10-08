import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTransactionText } from '../services/parserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleSentences = JSON.parse(fs.readFileSync(path.join(__dirname, 'testSentences.json'), 'utf8'));

test('parser handles Tamil and Tanglish credit entries', async () => {
  const result = await parseTransactionText(sampleSentences[0].input);
  assert.equal(result.success, true);
  assert.equal(result.data.intent, 'credit');
  assert.equal(result.data.customer, 'Murugan');
  assert.equal(result.data.amount, 120);
});

test('parser handles payment entries', async () => {
  const result = await parseTransactionText(sampleSentences[1].input);
  assert.equal(result.success, true);
  assert.equal(result.data.intent, 'payment');
  assert.equal(result.data.customer, 'Murugan');
  assert.equal(result.data.amount, 200);
});

test('parser handles missing amount', async () => {
  const result = await parseTransactionText(sampleSentences[7].input);
  assert.equal(result.success, true);
  assert.ok(result.missingFields.includes('amount'));
});

test('parser marks unknown customer entries as unknown', async () => {
  const result = await parseTransactionText(sampleSentences[14].input);
  assert.equal(result.success, true);
  assert.equal(result.data.intent, 'unknown');
});

test('parser converts number words and numeric amounts', async () => {
  const sentence = 'Kumar 8 kg rice 600 rupees credit';
  const result = await parseTransactionText(sentence);
  assert.equal(result.success, true);
  assert.equal(result.data.quantity, 8);
  assert.equal(result.data.amount, 600);
});

test('parser handles sample sentence list', async () => {
  for (const sentence of sampleSentences) {
    const result = await parseTransactionText(sentence.input);
    assert.equal(result.success, true);
    if (sentence.expected.intent === 'unknown') {
      assert.equal(result.data.intent, 'unknown');
      continue;
    }

    assert.equal(result.data.intent, sentence.expected.intent);
    assert.equal(result.data.customer, sentence.expected.customer ?? result.data.customer);
    assert.equal(result.data.item, sentence.expected.item ?? result.data.item);
    assert.equal(result.data.quantity, sentence.expected.quantity ?? result.data.quantity);
    assert.equal(result.data.unit, sentence.expected.unit ?? result.data.unit);
    assert.equal(result.data.amount, sentence.expected.amount ?? result.data.amount);
  }
});
