import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKeyPath = path.resolve(__dirname, '../API_Key');
let apiKey = '';
try {
  apiKey = fs.readFileSync(apiKeyPath, 'utf-8').trim();
} catch (e) {
  console.error("Could not read API_Key file.", e.message);
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const sourcePath = path.resolve(__dirname, '../src/data/iching_reference.json');
const destPath = path.resolve(__dirname, '../src/data/iching_reference_en.json');

const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
let translatedData = {};

if (fs.existsSync(destPath)) {
  translatedData = JSON.parse(fs.readFileSync(destPath, 'utf-8'));
}

async function translateHexagram(key, data) {
  const prompt = `Translate the following JSON object representing an I Ching hexagram from Traditional Chinese to English.
CRITICAL INSTRUCTIONS:
1. Keep the exact same JSON structure.
2. DO NOT translate ANY JSON keys. They must remain exactly as they are in the source.
3. This includes the inner keys of "aspects" ("事業", "感情", "健康", "財運") - DO NOT translate these keys, only translate their values.
4. The "position" values in the "lines" array (like "初九", "六二") SHOULD be translated to English (e.g. "Line 1 (Yang)", "Line 2 (Yin)", etc.)
5. Return ONLY the raw JSON string, without any markdown formatting or \`\`\`json wrappers.

Source JSON:
${JSON.stringify(data, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error(`Error translating hexagram ${key}:`, err.message);
    return null;
  }
}

async function main() {
  const keys = Object.keys(sourceData);
  let count = 0;
  for (const key of keys) {
    if (translatedData[key] && Object.keys(translatedData[key]).length > 0) {
      console.log(`Hexagram ${key} already translated. Skipping.`);
      continue;
    }
    
    console.log(`Translating hexagram ${key}...`);
    const result = await translateHexagram(key, sourceData[key]);
    if (result) {
      translatedData[key] = result;
      fs.writeFileSync(destPath, JSON.stringify(translatedData, null, 2), 'utf-8');
      count++;
    }
    // Sleep to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log(`Translation complete! Translated ${count} hexagrams.`);
}

main();
