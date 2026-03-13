const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../iching_reference.md');
const outPath = path.join(__dirname, '../src/data/iching_reference.json');

const content = fs.readFileSync(mdPath, 'utf8');

// The file has hexagrams separated by "### 第X卦　Y卦 ䷀"
const parts = content.split('### 第');

const hexagrams = {};

// We use HEXAGRAM_NAMES to map Chinese names to binary keys so we can look them up by key
const HEXAGRAM_NAMES = {
    "111111": "乾",
    "000000": "坤",
    "100010": "屯",
    "010001": "蒙",
    "111010": "需",
    "010111": "訟",
    "010000": "師",
    "000010": "比",
    "111011": "小畜",
    "110111": "履",
    "111000": "泰",
    "000111": "否",
    "101111": "同人",
    "111101": "大有",
    "001000": "謙",
    "000100": "豫",
    "100110": "隨",
    "011001": "蠱",
    "110000": "臨",
    "000011": "觀",
    "100101": "噬嗑",
    "101001": "賁",
    "000001": "剝",
    "100000": "復",
    "100111": "無妄",
    "111001": "大畜",
    "100001": "頤",
    "011110": "大過",
    "010010": "坎",
    "101101": "離",
    "001110": "咸",
    "011100": "恆",
    "001111": "遯",
    "111100": "大壯",
    "000101": "晉",
    "101000": "明夷",
    "101010": "家人",
    "010101": "睽",
    "001010": "蹇",
    "010100": "解",
    "110001": "損",
    "100011": "益",
    "111110": "夬",
    "011111": "姤",
    "000110": "萃",
    "011000": "升",
    "010110": "困",
    "011010": "井",
    "101110": "革",
    "011101": "鼎",
    "100100": "震",
    "001001": "艮",
    "001011": "漸",
    "110100": "歸妹",
    "101100": "豐",
    "001101": "旅",
    "011011": "巽",
    "110110": "兌",
    "010011": "渙",
    "110010": "節",
    "110011": "中孚",
    "001100": "小過",
    "101011": "既济", // Note: The mapping spelling "既濟"
    "110101": "未济", // Note: The mapping spelling "未濟"
};
// Add traditional variants for 既濟 and 未濟 just in case
HEXAGRAM_NAMES["101011"] = "既濟";
HEXAGRAM_NAMES["110101"] = "未濟";

// But I will better just iterate through Object.keys and find the match
function getBinaryKeyByName(chineseName) {
    for (const [bin, fullName] of Object.entries(HEXAGRAM_NAMES)) {
        if (fullName === chineseName) {
            return bin;
        }
    }
    return null;
}


// Start from index 1 because parts[0] is the header
for (let i = 1; i < parts.length; i++) {
    const section = parts[i];
    
    // Parse the header like: "一卦　乾卦 ䷀"
    const firstLineEnd = section.indexOf('\n');
    const header = section.substring(0, firstLineEnd);
    
    // Extract base name
    // header might be "第一卦　乾卦 ䷀" (but without "### 第" since we split on it, so it's "一卦　乾卦 ䷀")
    const cleanHeader = header.replace(/^[^\s　]+[　\s]+/, ''); // Removes "一卦　"
    const nameMatch = cleanHeader.match(/^([^\s　]+卦)/); // Matches "乾卦"
    if (!nameMatch) continue;
    
    const chineseFullName = nameMatch[1]; // e.g. "乾卦"
    let simpleName = chineseFullName.replace("卦", "");
    
    // Also try to find a mapping
    let binaryKey = getBinaryKeyByName(simpleName);
    
    // Special handling if simple name is not found
    if (!binaryKey) {
        // Find using include
        for (const [bin, mapName] of Object.entries(HEXAGRAM_NAMES)) {
            if (mapName === simpleName) {
                binaryKey = bin;
                break;
            }
        }
    }
    
    if (!binaryKey) {
        console.warn(`Could not find binary key for ${simpleName}`);
        continue;
    }
    
    const parsedData = {
        name: chineseFullName,
        symbolInfo: "",
        image: "",
        keywords: "",
        coreMeaning: "",
        aspects: {},
        transformationTip: "",
        notes: ""
    };
    
    const lines = section.split('\n');
    let inTable = false;
    let tableAspects = {};
    
    for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (!line) continue;
        
        if (line.startsWith('**卦符：**')) {
            const m = line.match(/\*\*卦符：\*\*\s*([^\*]+)\s*\*\*象：\*\*\s*([^\n]+)/);
            if (m) {
                parsedData.symbolInfo = m[1].replace(/　$/, '').trim();
                parsedData.image = m[2].trim();
            } else {
                // simple split
                const p1 = line.split('**象：**');
                parsedData.symbolInfo = p1[0].replace('**卦符：**', '').trim();
                if(p1[1]) parsedData.image = p1[1].trim();
            }
        } else if (line.startsWith('**卦辭關鍵字：**')) {
            parsedData.keywords = line.replace('**卦辭關鍵字：**', '').trim();
        } else if (line.startsWith('**核心意涵：**')) {
            parsedData.coreMeaning = line.replace('**核心意涵：**', '').trim();
        } else if (line.startsWith('**變卦提示：**')) {
            parsedData.transformationTip = line.replace('**變卦提示：**', '').trim();
        } else if (line.startsWith('**筆記：**')) {
            parsedData.notes = line.replace('**筆記：**', '').trim();
        } else if (line.startsWith('| 面向 | 提示 |') || line.startsWith('|------|------|')) {
            inTable = true;
        } else if (inTable && line.startsWith('|')) {
            const tableParts = line.split('|');
            if (tableParts.length >= 3) {
                const aspect = tableParts[1].trim();
                const tip = tableParts[2].trim();
                if (aspect && aspect !== '面向' && !aspect.startsWith('---')) {
                    parsedData.aspects[aspect] = tip;
                }
            }
        }
    }
    
    hexagrams[binaryKey] = parsedData;
}

fs.writeFileSync(outPath, JSON.stringify(hexagrams, null, 2));
console.log(`Wrote ${Object.keys(hexagrams).length} hexagrams to ${outPath}`);
