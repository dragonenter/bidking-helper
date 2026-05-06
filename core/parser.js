// core/parser.js
// Ported from sarkozyfan/bidking-bot's central_info_parser.py (MIT license).
// Original: https://github.com/sarkozyfan/bidking-bot/blob/main/bidking_maa_test/central_info_parser.py

// ---------------------------------------------------------------------------
// Color alias table (Chinese → internal color key)
// ---------------------------------------------------------------------------

const COLOR_ALIASES = {
  '蓝': 'blue',
  '蓝色': 'blue',
  '蓝色品质': 'blue',
  '紫': 'purple',
  '紫色': 'purple',
  '紫色品质': 'purple',
  '橙': 'gold',
  '橙色': 'gold',
  '橙色品质': 'gold',
  '金': 'gold',
  '金色': 'gold',
  '金色品质': 'gold',
  '黄': 'gold',
  '黄色': 'gold',
  '黄色品质': 'gold',
  '红': 'red',
  '红色': 'red',
  '红色品质': 'red',
  '绿': 'green',
  '绿色': 'green',
  '绿色品质': 'green',
  '白': 'white',
  '白色': 'white',
  '白色品质': 'white',
};

// ---------------------------------------------------------------------------
// Helper: color regex pattern (longer variants first for correct alternation)
// ---------------------------------------------------------------------------

function colorPattern() {
  return '(蓝色品质|紫色品质|橙色品质|金色品质|黄色品质|红色品质|绿色品质|白色品质|蓝色|紫色|橙色|金色|黄色|红色|绿色|白色|蓝|紫|橙|金|黄|红|绿|白)';
}

// ---------------------------------------------------------------------------
// Helper: optional item-type word
// ---------------------------------------------------------------------------

function optionalItemWordPattern() {
  return '(?:藏品|道具|品质藏品|品质道具)?';
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeText(text) {
  return text
    .replace(/：/g, ':')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/约为/g, '约')
    .replace(/本场拍卖/g, '本次竞拍');
}

function normalizeLine(line) {
  line = normalizeText(line);
  line = line.replace(/\s+/g, '');
  line = line.replace(/所有藏品总占用的格子数量/g, '所有藏品总格子数量');
  line = line.replace(/总占用的格子数量/g, '总格子数量');
  line = line.replace(/总占用格子数量/g, '总格子数量');
  line = line.replace(/平均格数约(?!为)/g, '平均格数约为');
  line = line.replace(/平均格子数约(?!为)/g, '平均格数约为');
  // "平均格数" stays as-is (Python line 76 is a no-op)
  return line;
}

function normalizeNumber(raw) {
  return parseFloat(raw.replace(/,/g, '').trim());
}

function maybeInt(value) {
  return Math.abs(value - Math.round(value)) < 1e-9 ? Math.round(value) : value;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function isLikelyItemLine(line) {
  return line.includes('藏品') || line.includes('品质') || line.includes('道具');
}

function hasWgPhrase(line) {
  return (
    line.includes('白色和绿色') ||
    line.includes('绿色和白色') ||
    line.includes('白绿') ||
    line.includes('白+绿')
  );
}

// ---------------------------------------------------------------------------
// Individual parse functions (one per Python function)
// ---------------------------------------------------------------------------

function parseTotalAll(line) {
  const patterns = [
    /总藏品数量为(\d+)件/,
    /共有(\d+)件/,
    /总数量为(\d+)件/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function parseVictorTotalAll(line) {
  const patterns = [
    /本次竞拍共有品质紫色[、,]金色[、,]红色(?:藏品|道具)(\d+)件/,
    /本次竞拍共有品质紫色[、,]橙色[、,]红色(?:藏品|道具)(\d+)件/,
    /共有品质紫色[、,]金色[、,]红色(?:藏品|道具)(\d+)件/,
    /共有品质紫色[、,]橙色[、,]红色(?:藏品|道具)(\d+)件/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function parseTotalGrid(line) {
  const patterns = [
    /所有藏品总格子数量为(\d+)格/,
    /全部总格子数量为(\d+)格/,
    /总藏品总格子数量为(\d+)格/,
    /本次竞拍(?:的)?总藏品总格子数量为(\d+)格/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function parseAvgGridAll(line) {
  const patterns = [
    /总平均格子数(?:为|是)?([0-9]+(?:\.[0-9]+)?)/,
    /平均格子数(?:为|是)?([0-9]+(?:\.[0-9]+)?)/,
    /每格平均(?:为|是)?([0-9]+(?:\.[0-9]+)?)/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return normalizeNumber(m[1]);
  }
  return null;
}

function parseGreenWhiteTotal(line) {
  const patterns = [
    /绿白总数量为(\d+)/,
    /绿白合计为(\d+)/,
    /绿白总件数为(\d+)/,
    /绿白总数为(\d+)/,
    /绿色白色总数量为(\d+)/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function parseGreenWhiteGrid(line) {
  const patterns = [
    /所有白色和绿色品质藏品总占位数为(\d+)格/,
    /所有白色和绿色品质藏品总格数为(\d+)格/,
    /所有白色和绿色品质藏品总格子数量为(\d+)格/,
    /白色和绿色品质藏品总占位数为(\d+)格/,
    /白色和绿色品质藏品总格数为(\d+)格/,
    /白色和绿色品质藏品总格子数量为(\d+)格/,
    /白绿总占位数为(\d+)格/,
    /白绿总格数为(\d+)格/,
    /白\+绿总格数为(\d+)格/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function parseGreenWhiteAvg(line) {
  const patterns = [
    /所有白色和绿色品质藏品平均格(?:子)?数(?:约为|为)?([\d,]+(?:\.\d+)?)(?:格)?/,
    /白色和绿色品质藏品平均格(?:子)?数(?:约为|为)?([\d,]+(?:\.\d+)?)(?:格)?/,
    /白绿平均格(?:子)?数(?:约为|为)?([\d,]+(?:\.\d+)?)(?:格)?/,
    /白\+绿平均格(?:子)?数(?:约为|为)?([\d,]+(?:\.\d+)?)(?:格)?/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return maybeInt(normalizeNumber(m[1]));
  }
  return null;
}

function parseGreenWhiteAvgPrice(line) {
  const patterns = [
    /所有白色和绿色品质藏品(?:的)?平均价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白色和绿色品质藏品(?:的)?平均价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白绿(?:的)?平均价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白\+绿(?:的)?平均价值约(?:为)?([\d,]+(?:\.\d+)?)/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return normalizeNumber(m[1]);
  }
  return null;
}

function parseGreenWhiteTotalPrice(line) {
  const patterns = [
    /所有白色和绿色品质藏品(?:的)?总价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白色和绿色品质藏品(?:的)?总价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白绿(?:的)?总价值约(?:为)?([\d,]+(?:\.\d+)?)/,
    /白\+绿(?:的)?总价值约(?:为)?([\d,]+(?:\.\d+)?)/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return normalizeNumber(m[1]);
  }
  return null;
}

function parseLowPrice(line) {
  const patterns = [
    /当前预估最低价格[:：]?([\d,]+(?:\.\d+)?)/,
    /预估最低价格[:：]?([\d,]+(?:\.\d+)?)/,
    /最低价格[:：]?([\d,]+(?:\.\d+)?)/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return normalizeNumber(m[1]);
  }
  return null;
}

function parseRound(line) {
  const m = /第(\d+)轮/.exec(line);
  return m ? parseInt(m[1], 10) : null;
}

function parseColorCount(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  // Pattern 1: <color>[item_word](的)?(总数量|总件数|件数|数量)为N(件)?
  const pat1 = new RegExp(
    colorPattern() + optionalItemWordPattern() + '(?:的)?(?:总数量|总件数|件数|数量)为(\\d+)(?:件)?'
  );
  let m = pat1.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], parseInt(m[2], 10)];

  // Pattern 2: 共有<color>[item_word]N(件)?
  const pat2 = new RegExp(
    '共有' + colorPattern() + optionalItemWordPattern() + '(\\d+)(?:件)?'
  );
  m = pat2.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], parseInt(m[2], 10)];

  return null;
}

function parseColorGrid(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  const pat = new RegExp(
    colorPattern() + optionalItemWordPattern() + '(?:的)?(?:总格子数量|总占用格子数量|占用的格子数量)为(\\d+)(?:格)?'
  );
  const m = pat.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], parseInt(m[2], 10)];
  return null;
}

function parseColorAvg(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  const pat = new RegExp(
    colorPattern() + optionalItemWordPattern() + '平均格(?:子)?数(?:约为|为)?(\\d+(?:\\.\\d+)?)(?:格)?'
  );
  const m = pat.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], maybeInt(normalizeNumber(m[2]))];
  return null;
}

function parseColorAvgPrice(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  // Pattern 1: 所有<color>[item_word]的?平均价值约(为)?N
  const pat1 = new RegExp(
    '所有' + colorPattern() + optionalItemWordPattern() + '的?平均价值约(?:为)?([\\d,]+(?:\\.\\d+)?)'
  );
  let m = pat1.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], normalizeNumber(m[2])];

  // Pattern 2: <color>[item_word](的)?平均价值约(为)?N
  const pat2 = new RegExp(
    colorPattern() + optionalItemWordPattern() + '(?:的)?平均价值约(?:为)?([\\d,]+(?:\\.\\d+)?)'
  );
  m = pat2.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], normalizeNumber(m[2])];

  return null;
}

function parseColorTotalPrice(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  // Pattern 1: 所有<color>[item_word]的?总价值约(为)?N
  const pat1 = new RegExp(
    '所有' + colorPattern() + optionalItemWordPattern() + '的?总价值约(?:为)?([\\d,]+(?:\\.\\d+)?)'
  );
  let m = pat1.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], normalizeNumber(m[2])];

  // Pattern 2: <color>[item_word](的)?总价值约(为)?N
  const pat2 = new RegExp(
    colorPattern() + optionalItemWordPattern() + '(?:的)?总价值约(?:为)?([\\d,]+(?:\\.\\d+)?)'
  );
  m = pat2.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], normalizeNumber(m[2])];

  return null;
}

function parseGenericAvg(line) {
  const m = /有(\d+)种藏品类型占位每格的均价约([\d,]+(?:\.\d+)?)/.exec(line);
  if (m) return [parseInt(m[1], 10), normalizeNumber(m[2])];
  return null;
}

// ---------------------------------------------------------------------------
// Additional patterns for broader input coverage
// ---------------------------------------------------------------------------

/**
 * Parse lines like "紫色、橙色、红色品质藏品共4件"
 * (victor total from a multi-color "共N件" phrasing without "本次竞拍共有品质" prefix)
 */
function parseVictorTotalAllAlt(line) {
  // Handles: 紫色[、,]橙色[、,]红色品质(藏品|道具)?共(\d+)件
  const patterns = [
    /紫色[、,]金色[、,]红色品质(?:藏品|道具)?共(\d+)件/,
    /紫色[、,]橙色[、,]红色品质(?:藏品|道具)?共(\d+)件/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

/**
 * Parse lines like "红色品质共3件" or "红色品质共有3件"
 * (single-color count with "共" phrasing)
 */
function parseColorCountAlt(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  // <color>[item_word]共(有)?N件
  const pat = new RegExp(
    colorPattern() + optionalItemWordPattern() + '共(?:有)?(\\d+)件'
  );
  const m = pat.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], parseInt(m[2], 10)];
  return null;
}

/**
 * Parse lines like "白色和绿色品质共6件"
 */
function parseWgTotalAlt(line) {
  const patterns = [
    /白色和绿色品质(?:藏品|道具)?共(\d+)件/,
    /绿色和白色品质(?:藏品|道具)?共(\d+)件/,
    /白绿(?:品质)?(?:藏品|道具)?共(\d+)件/,
    /白\+绿(?:品质)?(?:藏品|道具)?共(\d+)件/,
  ];
  for (const pat of patterns) {
    const m = pat.exec(line);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

/**
 * Parse lines like "蓝色品质共占用12个格子" or "橙色品质共占用12个格子"
 */
function parseColorGridAlt(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  const pat = new RegExp(
    colorPattern() + optionalItemWordPattern() + '(?:共)?占用(\\d+)(?:个)?格(?:子)?'
  );
  const m = pat.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], parseInt(m[2], 10)];
  return null;
}

/**
 * Parse lines like "紫色品质平均格数约为0.28" (already handled by parseColorAvg,
 * but the normalizeLine step converts "约" → "约为" so the existing pattern covers it.
 * This function is a safety net for "约为" directly in input without normalization.)
 */
function parseColorAvgWithAboutFor(line) {
  if (hasWgPhrase(line) || !isLikelyItemLine(line)) return null;

  const pat = new RegExp(
    colorPattern() + optionalItemWordPattern() + '平均格(?:子)?数约为([\\d,]+(?:\\.\\d+)?)(?:格)?'
  );
  const m = pat.exec(line);
  if (m) return [COLOR_ALIASES[m[1]], maybeInt(normalizeNumber(m[2]))];
  return null;
}

// ---------------------------------------------------------------------------
// Main export: parseCentralInfo
// ---------------------------------------------------------------------------

/**
 * Parse BidKing central-info OCR text into a structured result.
 *
 * @param {string} text - Raw OCR text (may be multi-line)
 * @returns {Object} Parsed result compatible with enumerateCombos()
 */
export function parseCentralInfo(text) {
  const result = {
    parsed_facts: [],
    unparsed_lines: [],
  };

  const lines = (text || '').split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    let parsedAny = false;

    // --- round ---
    const roundValue = parseRound(line);
    if (roundValue !== null) {
      result.round = roundValue;
      result.parsed_facts.push({ field: 'round', value: roundValue, line: rawLine });
      parsedAny = true;
    }

    // --- total_all ---
    const totalAll = parseTotalAll(line);
    if (totalAll !== null) {
      result.total_all = totalAll;
      result.parsed_facts.push({ field: 'total_all', value: totalAll, line: rawLine });
      parsedAny = true;
    }

    // --- victor_total_all ---
    let victorTotalAll = parseVictorTotalAll(line);
    if (victorTotalAll === null) victorTotalAll = parseVictorTotalAllAlt(line);
    if (victorTotalAll !== null) {
      result.victor_total_all = victorTotalAll;
      result.parsed_facts.push({ field: 'victor_total_all', value: victorTotalAll, line: rawLine });
      parsedAny = true;
    }

    // --- total_grid_all ---
    const totalGrid = parseTotalGrid(line);
    if (totalGrid !== null) {
      result.total_grid_all = totalGrid;
      result.parsed_facts.push({ field: 'total_grid_all', value: totalGrid, line: rawLine });
      parsedAny = true;
    }

    // --- avg_grid_all ---
    const avgGridAll = parseAvgGridAll(line);
    if (avgGridAll !== null) {
      result.avg_grid_all = avgGridAll;
      result.parsed_facts.push({ field: 'avg_grid_all', value: avgGridAll, line: rawLine });
      parsedAny = true;
    }

    // --- wg_total (from green+white combined phrasing) ---
    let wgTotal = parseGreenWhiteTotal(line);
    if (wgTotal === null) wgTotal = parseWgTotalAlt(line);
    if (wgTotal !== null) {
      result.wg_total = wgTotal;
      result.parsed_facts.push({ field: 'wg_total', value: wgTotal, line: rawLine });
      parsedAny = true;
    }

    // --- wg grid ---
    const wgGrid = parseGreenWhiteGrid(line);
    if (wgGrid !== null) {
      result.grid_wg = wgGrid;
      result.parsed_facts.push({ field: 'grid_wg', value: wgGrid, line: rawLine });
      parsedAny = true;
    }

    // --- wg avg grid ---
    const wgAvg = parseGreenWhiteAvg(line);
    if (wgAvg !== null) {
      result.avg_wg = wgAvg;
      result.parsed_facts.push({ field: 'avg_wg', value: wgAvg, line: rawLine });
      parsedAny = true;
    }

    // --- wg avg price ---
    const wgAvgPrice = parseGreenWhiteAvgPrice(line);
    if (wgAvgPrice !== null) {
      result.avg_price_wg = wgAvgPrice;
      result.parsed_facts.push({ field: 'avg_price_wg', value: wgAvgPrice, line: rawLine });
      parsedAny = true;
    }

    // --- wg total price ---
    const wgTotalPrice = parseGreenWhiteTotalPrice(line);
    if (wgTotalPrice !== null) {
      result.total_price_wg = wgTotalPrice;
      result.parsed_facts.push({ field: 'total_price_wg', value: wgTotalPrice, line: rawLine });
      parsedAny = true;
    }

    // --- observed_low_price ---
    const lowPrice = parseLowPrice(line);
    if (lowPrice !== null) {
      result.observed_low_price = lowPrice;
      result.parsed_facts.push({ field: 'observed_low_price', value: lowPrice, line: rawLine });
      parsedAny = true;
    }

    // --- per-color count ---
    let colorCount = parseColorCount(line);
    if (colorCount === null) colorCount = parseColorCountAlt(line);
    if (colorCount !== null) {
      const [color, value] = colorCount;
      result[`count_${color}`] = value;
      result.parsed_facts.push({ field: `count_${color}`, value, line: rawLine });
      parsedAny = true;
    }

    // --- per-color grid ---
    let colorGrid = parseColorGrid(line);
    if (colorGrid === null) colorGrid = parseColorGridAlt(line);
    if (colorGrid !== null) {
      const [color, value] = colorGrid;
      result[`grid_${color}`] = value;
      result.parsed_facts.push({ field: `grid_${color}`, value, line: rawLine });
      parsedAny = true;
    }

    // --- per-color avg grid ---
    let colorAvg = parseColorAvg(line);
    if (colorAvg === null) colorAvg = parseColorAvgWithAboutFor(line);
    if (colorAvg !== null) {
      const [color, value] = colorAvg;
      result[`avg_${color}`] = value;
      result.parsed_facts.push({ field: `avg_${color}`, value, line: rawLine });
      parsedAny = true;
    }

    // --- per-color avg price ---
    const colorAvgPrice = parseColorAvgPrice(line);
    if (colorAvgPrice !== null) {
      const [color, value] = colorAvgPrice;
      result[`avg_price_${color}`] = value;
      result.parsed_facts.push({ field: `avg_price_${color}`, value, line: rawLine });
      parsedAny = true;
    }

    // --- per-color total price ---
    const colorTotalPrice = parseColorTotalPrice(line);
    if (colorTotalPrice !== null) {
      const [color, value] = colorTotalPrice;
      result[`total_price_${color}`] = value;
      result.parsed_facts.push({ field: `total_price_${color}`, value, line: rawLine });
      parsedAny = true;
    }

    // --- generic avg (mixed type) ---
    const genericAvg = parseGenericAvg(line);
    if (genericAvg !== null) {
      const [typeCount, avgPrice] = genericAvg;
      result.mixed_type_count = typeCount;
      result.mixed_type_avg_grid_price = avgPrice;
      result.parsed_facts.push({ field: 'mixed_type_count', value: typeCount, line: rawLine });
      result.parsed_facts.push({ field: 'mixed_type_avg_grid_price', value: avgPrice, line: rawLine });
      parsedAny = true;
    }

    if (!parsedAny) {
      result.unparsed_lines.push(rawLine);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exported helpers (useful for testing / downstream consumers)
// ---------------------------------------------------------------------------

export {
  COLOR_ALIASES,
  colorPattern,
  optionalItemWordPattern,
  normalizeText,
  normalizeLine,
  normalizeNumber,
  maybeInt,
  isLikelyItemLine,
  hasWgPhrase,
  parseTotalAll,
  parseVictorTotalAll,
  parseTotalGrid,
  parseAvgGridAll,
  parseGreenWhiteTotal,
  parseGreenWhiteGrid,
  parseGreenWhiteAvg,
  parseGreenWhiteAvgPrice,
  parseGreenWhiteTotalPrice,
  parseLowPrice,
  parseRound,
  parseColorCount,
  parseColorGrid,
  parseColorAvg,
  parseColorAvgPrice,
  parseColorTotalPrice,
  parseGenericAvg,
};
