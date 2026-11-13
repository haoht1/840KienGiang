/**
 * Convert Vietnamese currency numbers to words accurately.
 * Handles numbers from 0 up to thousands of billions (nghìn tỷ).
 * Example: 922665000 -> "Chín trăm hai mươi hai triệu sáu trăm sáu mươi lăm nghìn đồng"
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readThreeDigits(threeDigits: number, isHighestGroup: boolean = false): string {
  const hundreds = Math.floor(threeDigits / 100);
  const tens = Math.floor((threeDigits % 100) / 10);
  const units = threeDigits % 10;

  if (threeDigits === 0) return '';

  let result = '';

  // Read hundreds
  if (!isHighestGroup || hundreds > 0) {
    result += `${DIGITS[hundreds]} trăm `;
  }

  // Read tens
  if (tens === 0) {
    if (units > 0) {
      if (!isHighestGroup || hundreds > 0) {
        result += 'linh ';
      }
      result += DIGITS[units];
    }
  } else if (tens === 1) {
    result += 'mười ';
    if (units === 1) {
      result += 'một';
    } else if (units === 5) {
      result += 'lăm';
    } else if (units > 0) {
      result += DIGITS[units];
    }
  } else {
    result += `${DIGITS[tens]} mươi `;
    if (units === 1) {
      result += 'mốt';
    } else if (units === 4) {
      result += 'tư';
    } else if (units === 5) {
      result += 'lăm';
    } else if (units > 0) {
      result += DIGITS[units];
    }
  }

  return result.trim();
}

export function numberToVietnameseWords(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return 'Không đồng';
  
  const parsed = typeof num === 'string' ? Math.round(Number(num.replace(/[^0-9.-]+/g, ''))) : Math.round(num);
  if (isNaN(parsed) || parsed === 0) return 'Không đồng';
  if (parsed < 0) {
    return `Âm ${numberToVietnameseWords(Math.abs(parsed)).toLowerCase()}`;
  }

  const unitsScale = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const groups: number[] = [];
  let temp = parsed;

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];

  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const isHighest = i === groups.length - 1;
      const readGroup = readThreeDigits(groupVal, isHighest);
      const scale = unitsScale[i];
      if (scale) {
        words.push(`${readGroup} ${scale}`);
      } else {
        words.push(readGroup);
      }
    }
  }

  let finalStr = words.join(' ').replace(/\s+/g, ' ').trim();
  if (!finalStr) return 'Không đồng';

  // Capitalize first letter
  finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + ' đồng';
  return finalStr;
}
