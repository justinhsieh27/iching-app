
import { generateLineRandomly } from './iching.js';

function testProbabilities() {
    const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
    const total = 10000;

    for (let i = 0; i < total; i++) {
        const val = generateLineRandomly();
        if (counts[val] !== undefined) {
            counts[val]++;
        } else {
            console.error("Invalid value:", val);
        }
    }

    console.log("Total runs:", total);
    console.log(`6 (Old Yin):   ${counts[6]} (${(counts[6] / total * 100).toFixed(2)}%) - Expected ~6.25%`);
    console.log(`7 (Young Yang): ${counts[7]} (${(counts[7] / total * 100).toFixed(2)}%) - Expected ~31.25%`);
    console.log(`8 (Young Yin):  ${counts[8]} (${(counts[8] / total * 100).toFixed(2)}%) - Expected ~43.75%`);
    console.log(`9 (Old Yang):   ${counts[9]} (${(counts[9] / total * 100).toFixed(2)}%) - Expected ~18.75%`);
}

testProbabilities();
