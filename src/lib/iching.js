
// Constants for line types
export const OLD_YIN = 6;
export const YOUNG_YANG = 7;
export const YOUNG_YIN = 8;
export const OLD_YANG = 9;

/**
 * Calculates the remainder for counting by 4s.
 * If remainder is 0, it counts as 4.
 * @param {number} n
 * @returns {number} 1, 2, 3, or 4
 */
function getRemainder4(n) {
    const r = n % 4;
    return r === 0 ? 4 : r;
}

/**
 * Simulates one "Change" (division) process.
 * @param {number} totalStalks
 * @param {number} splitRatio - Optional fixed split for manual control (0.0 to 1.0). If null, random.
 * @returns {object} { left, right, leftRem, rightRem, removed, remaining }
 */
export function performChange(totalStalks, splitRatio = null) {
    // 1. Split into Left and Right
    // If splitRatio is provided (from UI click), use it. Otherwise random.

    let leftCount;
    if (splitRatio !== null) {
        leftCount = Math.floor(totalStalks * splitRatio);
        // Ensure at least 1 on each side essentially, though algorithm usually implies standard bell curve.
        // We'll clamp to ensure we can take 1 from right.
        if (leftCount < 1) leftCount = 1;
        if (leftCount > totalStalks - 2) leftCount = totalStalks - 2;
    } else {
        // Random split. Usually roughly half-half, but can be anywhere.
        // The "standard" simulation often uses a random cut.
        // We'll use a random integer between 1 and total-2.
        leftCount = Math.floor(Math.random() * (totalStalks - 2)) + 1;
    }

    const rightCount = totalStalks - leftCount;

    // 2. Take 1 from Right
    const rightActive = rightCount - 1;
    const taken = 1;

    // 3. Count Left by 4s
    const leftRem = getRemainder4(leftCount);

    // 4. Count Right (Active) by 4s
    const rightRem = getRemainder4(rightActive);

    // 5. Total Removed
    const removed = taken + leftRem + rightRem;

    return {
        left: leftCount,
        right: rightCount, // Original right count before taking 1
        splitRatio, // For reference if needed
        leftRem,
        rightRem,
        removed,
        remaining: totalStalks - removed
    };
}

/**
 * Generates one line (Yao) ensuring 3 successful changes.
 * This is for the automated generation or verification logic.
 * The UI will likely call performChange step-by-step.
 * @returns {number} 6, 7, 8, or 9
 */
export function generateLineRandomly() {
    let stalks = 49; // Start with 49

    // 3 Changes
    for (let i = 0; i < 3; i++) {
        const result = performChange(stalks);
        stalks = result.remaining;
    }

    const lineValue = stalks / 4;
    return lineValue;
}

// Minimal Hexagram lookup (KING WEN SEQUENCE)
// We construct the key from Bottom->Top lines using 0 for Yin (6,8) and 1 for Yang (7,9).
const HEXAGRAM_NAMES = {
    "111111": "乾 (Qián) - The Creative",
    "000000": "坤 (Kūn) - The Receptive",
    "100010": "屯 (Zhūn) - Difficulty at the Beginning",
    "010001": "蒙 (Méng) - Youthful Folly",
    "111010": "需 (Xū) - Waiting",
    "010111": "訟 (Sòng) - Conflict",
    "010000": "師 (Shī) - The Army",
    "000010": "比 (Bǐ) - Holding Together",
    "111011": "小畜 (Xiǎo Chù) - The Taming Power of the Small",
    "110111": "履 (Lǚ) - Treading",
    "111000": "泰 (Tài) - Peace",
    "000111": "否 (Pǐ) - Standstill",
    "101111": "同人 (Tóng Rén) - Fellowship with Men",
    "111101": "大有 (Dà Yǒu) - Possession in Great Measure",
    "001000": "謙 (Qiān) - Modesty",
    "000100": "豫 (Yù) - Enthusiasm",
    "100110": "隨 (Suí) - Following",
    "011001": "蠱 (Gǔ) - Work on What Has Been Spoiled",
    "110000": "臨 (Lín) - Approach",
    "000011": "觀 (Guān) - Contemplation",
    "100101": "噬嗑 (Shì Kè) - Biting Through",
    "101001": "賁 (Bì) - Grace",
    "000001": "剝 (Bō) - Splitting Apart",
    "100000": "復 (Fù) - Return",
    "100111": "無妄 (Wú Wàng) - Innocence",
    "111001": "大畜 (Dà Chù) - The Taming Power of the Great",
    "100001": "頤 (Yí) - The Corners of the Mouth",
    "011110": "大過 (Dà Guò) - Preponderance of the Great",
    "010010": "坎 (Kǎn) - The Abysmal (Water)",
    "101101": "離 (Lí) - The Clinging (Fire)",
    "001110": "咸 (Xián) - Influence",
    "011100": "恆 (Héng) - Duration",
    "001111": "遯 (Dùn) - Retreat",
    "111100": "大壯 (Dà Zhuàng) - The Power of the Great",
    "000101": "晉 (Jìn) - Progress",
    "101000": "明夷 (Míng Yí) - Darkening of the Light",
    "101011": "家人 (Jiā Rén) - The Family",
    "110101": "睽 (Kuí) - Opposition",
    "001010": "蹇 (Jiǎn) - Obstruction",
    "010100": "解 (Xiè) - Deliverance",
    "110001": "損 (Sǔn) - Decrease",
    "100011": "益 (Yì) - Increase",
    "111110": "夬 (Guài) - Break-through",
    "011111": "姤 (Gòu) - Coming to Meet",
    "000110": "萃 (Cuì) - Gathering Together",
    "011000": "升 (Shēng) - Pushing Upward",
    "010110": "困 (Kùn) - Oppression",
    "011010": "井 (Jǐng) - The Well",
    "101110": "革 (Gé) - Revolution",
    "011101": "鼎 (Dǐng) - The Cauldron",
    "100100": "震 (Zhèn) - The Arousing (Thunder)",
    "001001": "艮 (Gèn) - Keeping Still (Mountain)",
    "001011": "漸 (Jiàn) - Development",
    "110100": "歸妹 (Guī Mèi) - The Marrying Maiden",
    "101100": "豐 (Fēng) - Abundance",
    "001101": "旅 (Lǚ) - The Wanderer",
    "011011": "巽 (Xùn) - The Gentle (Wind)",
    "110110": "兌 (Duì) - The Joyous (Lake)",
    "010011": "渙 (Huàn) - Dispersion",
    "110010": "節 (Jié) - Limitation",
    "110011": "中孚 (Zhōng Fú) - Inner Truth",
    "001100": "小過 (Xiǎo Guò) - Preponderance of the Small",
    "101010": "既濟 (Jì Jì) - After Completion",
    "010101": "未濟 (Wèi Jì) - Before Completion",
};

/**
 * Returns the hexagram key given an array of 6 line values (bottom to top).
 * Uses 6/8 as Yin (0) and 7/9 as Yang (1).
 * @param {Array<number>} lines [line1, line2, ..., line6]
 * @returns {string} The key or "unknown"
 */
export function getHexagramKey(lines) {
    if (!lines || lines.length !== 6) return "unknown";

    const binaryString = lines.map(val => {
        // 6(Old Yin), 8(Young Yin) -> 0
        // 7(Young Yang), 9(Old Yang) -> 1
        return (val === 7 || val === 9) ? "1" : "0";
    }).join("");

    return binaryString;
}
