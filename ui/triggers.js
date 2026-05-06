// ui/triggers.js
// Trigger phrase detectors.
// Port of sarkozyfan's fresh_bidking_bot.py lines 327-415
// (normalize_text, compact_text, has_end_prompt, has_auction_lobby,
//  has_home_bid_button, has_reward_continue, parse_round_number).

/**
 * Normalize full-width digits and Roman numerals to ASCII equivalents.
 * Port of sarkozyfan's normalize_text().
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/０/g, '0').replace(/１/g, '1').replace(/２/g, '2')
    .replace(/３/g, '3').replace(/４/g, '4').replace(/５/g, '5')
    .replace(/６/g, '6').replace(/７/g, '7').replace(/８/g, '8')
    .replace(/９/g, '9')
    .replace(/Ⅰ/g, 'I').replace(/Ⅱ/g, 'II').replace(/Ⅲ/g, 'III')
    .replace(/Ⅳ/g, 'IV').replace(/Ⅴ/g, 'V');
}

/**
 * Normalize then strip all whitespace.
 * Port of sarkozyfan's compact_text().
 */
function compactText(text) {
  return normalizeText(text).replace(/\s+/g, '');
}

/**
 * Chinese number → integer for round tokens.
 * Port of sarkozyfan's CHINESE_ROUND_NUMBERS + round_token_to_int().
 */
const CHINESE_ROUND_NUMBERS = {
  '一': 1, '壹': 1, '二': 2, '两': 2, '贰': 2, '三': 3, '叁': 3,
  '四': 4, '肆': 4, '五': 5, '伍': 5,
  'I': 1, 'l': 1, '丨': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
};

function roundTokenToInt(token) {
  token = normalizeText(token).trim();
  if (/^\d+$/.test(token)) {
    const v = parseInt(token, 10);
    return v >= 1 && v <= 5 ? v : null;
  }
  const v = CHINESE_ROUND_NUMBERS[token.toUpperCase()] ?? CHINESE_ROUND_NUMBERS[token];
  return (v !== undefined && v >= 1 && v <= 5) ? v : null;
}

/**
 * Detect 对局结束 / 本局结束 triggers.
 * Port of sarkozyfan's has_end_prompt().
 * @param {string} text
 * @returns {boolean}
 */
export function hasEndPrompt(text) {
  const tight = compactText(text);
  if (tight.includes('对局结束')) return true;
  if (tight.includes('本局结束')) return true;
  return tight.includes('对局') && tight.includes('结束');
}

/**
 * Detect 竞拍大厅 / 选择拍场 triggers.
 * Port of sarkozyfan's has_auction_lobby().
 * @param {string} text
 * @returns {boolean}
 */
export function hasAuctionLobby(text) {
  const tight = compactText(text);
  if (tight.includes('竞拍大厅')) return true;
  if (tight.includes('选择拍场')) return true;
  return tight.includes('竞拍') && tight.includes('大厅');
}

/**
 * Detect home bid button presence (竞拍 anywhere in text).
 * Port of sarkozyfan's has_home_bid_button().
 * @param {string} text
 * @returns {boolean}
 */
export function hasHomeBidButton(text) {
  const tight = compactText(text);
  return tight.includes('竞拍');
}

/**
 * Detect reward / continue screen (EXP + 继续).
 * Port of sarkozyfan's has_reward_continue().
 * @param {string} text
 * @returns {boolean}
 */
export function hasRewardContinue(text) {
  const tight = compactText(text);
  return tight.toUpperCase().includes('EXP') && tight.includes('继续'); // 继续
}

/**
 * Parse round number (1-5) from OCR text.
 * Port of sarkozyfan's parse_round_number() + round patterns.
 * Returns integer 1-5 or null.
 * @param {string} text
 * @returns {number|null}
 */
export function parseRoundNumber(text) {
  const raw = normalizeText(text);
  const TOKEN = '[1-5一二两三四五壹贰叁肆伍IⅤVⅡⅢⅣlⅠ丨]+';

  // Spaced patterns (run on raw text)
  const spacedPatterns = [
    new RegExp(`第\\s*(${TOKEN})\\s*(?:轮|回合)`, 'i'),
    new RegExp(`(?:当前|现在)?(?:轮次|回合)\\s*[:：]?\\s*第?\\s*(${TOKEN})`, 'i'),
  ];
  for (const pat of spacedPatterns) {
    for (const match of raw.matchAll(new RegExp(pat.source, pat.flags + 'g'))) {
      const v = roundTokenToInt(match[1].toUpperCase());
      if (v !== null) return v;
    }
  }

  // Compact patterns (run on whitespace-stripped text)
  const tight = compactText(raw);
  const tightPatterns = [
    new RegExp(`第(${TOKEN})(?:轮|回合)`, 'i'),
    new RegExp(`(?:轮次|回合)[:：]?第?(${TOKEN})`, 'i'),
  ];
  for (const pat of tightPatterns) {
    const match = tight.match(new RegExp(pat.source, pat.flags));
    if (match) {
      const v = roundTokenToInt(match[1].toUpperCase());
      if (v !== null) return v;
    }
  }

  return null;
}
