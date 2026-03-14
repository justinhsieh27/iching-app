import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mdPath = path.resolve(__dirname, '../iching_reference.md');
const jsonPath = path.resolve(__dirname, '../src/data/iching_reference.json');

const md = fs.readFileSync(mdPath, 'utf8');
const oldJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// create a mapping from hexagram name to its binary key
const nameToKey = {};
for (const [key, val] of Object.entries(oldJson)) {
  nameToKey[val.name] = key;
}

const linesArray = md.split('\n');
let currentName = null;
let currentKey = null;

const newJson = { ...oldJson };

for (let i = 0; i < linesArray.length; i++) {
  const line = linesArray[i];
  
  // match ### 第一卦　乾卦 ䷀
  const hexMatch = line.match(/^### 第[一二三四五六七八九十百]+卦\s+(.*卦)/);
  if (hexMatch) {
    currentName = hexMatch[1].trim();
    currentKey = nameToKey[currentName];
    if (currentKey) {
       newJson[currentKey].lines = [];
    } else {
       console.warn(`Could not find key for ${currentName}`);
    }
  }

  // Find 六爻解析
  if (currentKey && line.includes('六爻解析：')) {
    // Usually there's a blank line or headers following
    while (i + 1 < linesArray.length && !linesArray[i + 1].trim().startsWith('|')) {
        i++;
    }
    
    // now we are just before the table or at the table header
    if (linesArray[i + 1] && linesArray[i + 1].trim().startsWith('|')) {
        i++; // this is the header: | 爻位 | 爻辭 | 解析 |
    }
    if (linesArray[i + 1] && linesArray[i + 1].includes('|------')) {
        i++; // skip separator
    }
    
    i++; // first data row
    
    while(i < linesArray.length && linesArray[i].trim().startsWith('|')) {
        const parts = linesArray[i].split('|').map(p => p.trim());
        if (parts.length >= 4 && parts[1] && parts[1] !== '爻位') {
            newJson[currentKey].lines.push({
                position: parts[1],
                text: parts[2],
                meaning: parts[3]
            });
        }
        i++;
    }
    i--;
  }
}

// verify
let keysWithLines = 0;
for (const key of Object.keys(newJson)) {
    if (newJson[key].lines && newJson[key].lines.length > 0) {
        keysWithLines++;
    }
}
console.log(`Parsed markdown and added lines for ${keysWithLines} hexagrams.`);

fs.writeFileSync(jsonPath, JSON.stringify(newJson, null, 2));
console.log('Updated src/data/iching_reference.json');
