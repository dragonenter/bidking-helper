// tests/parser.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCentralInfo } from '../core/parser.js';

// ---------------------------------------------------------------------------
// total_all
// ---------------------------------------------------------------------------

test('parses 总藏品数量为N件 (total_all)', () => {
  const r = parseCentralInfo('本次竞拍总藏品数量为20件');
  assert.equal(r.total_all, 20);
});

test('parses 共有N件 as total_all', () => {
  const r = parseCentralInfo('共有15件');
  assert.equal(r.total_all, 15);
});

test('parses 总数量为N件 as total_all', () => {
  const r = parseCentralInfo('总数量为25件');
  assert.equal(r.total_all, 25);
});

// ---------------------------------------------------------------------------
// victor_total_all  (紫+橙/金+红)
// ---------------------------------------------------------------------------

test('parses 紫色、橙色、红色品质藏品共N件 (victor_total_all)', () => {
  const r = parseCentralInfo('紫色、橙色、红色品质藏品共4件');
  assert.equal(r.victor_total_all, 4);
});

test('parses 紫色、金色、红色品质藏品共N件 (victor_total_all alt alias)', () => {
  const r = parseCentralInfo('紫色、金色、红色品质藏品共3件');
  assert.equal(r.victor_total_all, 3);
});

test('parses 本次竞拍共有品质紫色,橙色,红色藏品N件 (victor_total_all long form)', () => {
  const r = parseCentralInfo('本次竞拍共有品质紫色,橙色,红色藏品6件');
  assert.equal(r.victor_total_all, 6);
});

// ---------------------------------------------------------------------------
// count per color
// ---------------------------------------------------------------------------

test('parses 红色品质共3件 (count_red, alt phrase)', () => {
  const r = parseCentralInfo('红色品质共3件');
  assert.equal(r.count_red, 3);
});

test('parses 紫色藏品数量为2件 (count_purple)', () => {
  const r = parseCentralInfo('紫色藏品数量为2件');
  assert.equal(r.count_purple, 2);
});

test('parses 共有蓝色藏品5件 (count_blue)', () => {
  const r = parseCentralInfo('共有蓝色藏品5件');
  assert.equal(r.count_blue, 5);
});

test('parses 橙色品质总数量为1件 (count_gold via 橙色)', () => {
  const r = parseCentralInfo('橙色品质总数量为1件');
  assert.equal(r.count_gold, 1);
});

test('parses 金色品质共有2件 (count_gold via 金色)', () => {
  const r = parseCentralInfo('金色品质共有2件');
  assert.equal(r.count_gold, 2);
});

// ---------------------------------------------------------------------------
// avg grid per color
// ---------------------------------------------------------------------------

test('parses 紫色品质平均格数约为0.28 (avg_purple)', () => {
  const r = parseCentralInfo('紫色品质平均格数约为0.28');
  assert.ok(Math.abs(r.avg_purple - 0.28) < 1e-6);
});

test('parses 红色藏品平均格子数约为1.5 (avg_red)', () => {
  const r = parseCentralInfo('红色藏品平均格子数约为1.5');
  assert.ok(Math.abs(r.avg_red - 1.5) < 1e-6);
});

test('parses 蓝色品质平均格数为2 (avg_blue integer)', () => {
  const r = parseCentralInfo('蓝色品质平均格数为2');
  assert.equal(r.avg_blue, 2);
});

// ---------------------------------------------------------------------------
// grid per color
// ---------------------------------------------------------------------------

test('parses 橙色品质共占用12个格子 (grid_gold)', () => {
  const r = parseCentralInfo('橙色品质共占用12个格子');
  assert.equal(r.grid_gold, 12);
});

test('parses 蓝色藏品总格子数量为10格 (grid_blue)', () => {
  const r = parseCentralInfo('蓝色藏品总格子数量为10格');
  assert.equal(r.grid_blue, 10);
});

test('parses 紫色品质占用的格子数量为3格 (grid_purple)', () => {
  const r = parseCentralInfo('紫色品质占用的格子数量为3格');
  assert.equal(r.grid_purple, 3);
});

// ---------------------------------------------------------------------------
// round number
// ---------------------------------------------------------------------------

test('parses 第3轮竞价开始 (round)', () => {
  const r = parseCentralInfo('第3轮竞价开始');
  assert.equal(r.round, 3);
});

test('parses 第1轮 (round=1)', () => {
  const r = parseCentralInfo('第1轮');
  assert.equal(r.round, 1);
});

// ---------------------------------------------------------------------------
// wg_total (white+green combined)
// ---------------------------------------------------------------------------

test('parses 白色和绿色品质共6件 (wg_total)', () => {
  const r = parseCentralInfo('白色和绿色品质共6件');
  assert.equal(r.wg_total, 6);
});

test('parses 绿白总数量为8 (wg_total long form)', () => {
  const r = parseCentralInfo('绿白总数量为8');
  assert.equal(r.wg_total, 8);
});

test('parses 绿色白色总数量为4 (wg_total green+white alt)', () => {
  const r = parseCentralInfo('绿色白色总数量为4');
  assert.equal(r.wg_total, 4);
});

// ---------------------------------------------------------------------------
// total_grid_all
// ---------------------------------------------------------------------------

test('parses 所有藏品总格子数量为50格 (total_grid_all)', () => {
  const r = parseCentralInfo('所有藏品总格子数量为50格');
  assert.equal(r.total_grid_all, 50);
});

// ---------------------------------------------------------------------------
// avg_grid_all
// ---------------------------------------------------------------------------

test('parses 总平均格子数为2.5 (avg_grid_all)', () => {
  const r = parseCentralInfo('总平均格子数为2.5');
  assert.ok(Math.abs(r.avg_grid_all - 2.5) < 1e-6);
});

// ---------------------------------------------------------------------------
// low price
// ---------------------------------------------------------------------------

test('parses 最低价格:500 (observed_low_price)', () => {
  const r = parseCentralInfo('最低价格:500');
  assert.equal(r.observed_low_price, 500);
});

test('parses 预估最低价格：1000 (observed_low_price, full-width colon)', () => {
  const r = parseCentralInfo('预估最低价格：1000');
  assert.equal(r.observed_low_price, 1000);
});

// ---------------------------------------------------------------------------
// Multi-line and integration
// ---------------------------------------------------------------------------

test('multi-line input combines facts', () => {
  const r = parseCentralInfo(`
本次竞拍总藏品数量为20件
紫色、橙色、红色品质共4件
红色品质共1件
`);
  assert.equal(r.total_all, 20);
  assert.equal(r.victor_total_all, 4);
  assert.equal(r.count_red, 1);
});

test('unparsed lines are tracked', () => {
  const r = parseCentralInfo('foo bar 不可识别的内容');
  assert.ok(r.unparsed_lines.length >= 1);
});

test('parsed_facts has entries with field+value+line', () => {
  const r = parseCentralInfo('本次竞拍总藏品数量为20件');
  assert.ok(r.parsed_facts.length >= 1);
  const f = r.parsed_facts.find((f) => f.field === 'total_all');
  assert.ok(f);
  assert.equal(f.value, 20);
  assert.equal(typeof f.line, 'string');
});

test('empty input returns empty arrays', () => {
  const r = parseCentralInfo('');
  assert.deepEqual(r.parsed_facts, []);
  assert.deepEqual(r.unparsed_lines, []);
});

test('null/undefined input does not throw', () => {
  assert.doesNotThrow(() => parseCentralInfo(null));
  assert.doesNotThrow(() => parseCentralInfo(undefined));
});

// ---------------------------------------------------------------------------
// Normalization / OCR variants
// ---------------------------------------------------------------------------

test('本场拍卖 normalizes to 本次竞拍 (parse total)', () => {
  // After normalization, 本场拍卖总藏品数量为18件 → 本次竞拍总藏品数量为18件
  const r = parseCentralInfo('本场拍卖总藏品数量为18件');
  assert.equal(r.total_all, 18);
});

test('full-width colon in 最低价格 is handled', () => {
  // "：" (U+FF1A) normalizes to ":"
  const r = parseCentralInfo('最低价格：750');
  assert.equal(r.observed_low_price, 750);
});

test('whitespace between characters is collapsed before matching', () => {
  // normalizeLine strips all \s+, so spaces inside a line are removed
  const r = parseCentralInfo('第 5 轮 竞 价');
  assert.equal(r.round, 5);
});

test('约为 normalizes to 约 so avg patterns still match', () => {
  // normalizeText replaces 约为→约, then normalizeLine may restore 平均格数约为
  // Either way the number should be captured
  const r = parseCentralInfo('橙色品质平均格数约为3');
  assert.equal(r.avg_gold, 3);
});

// ---------------------------------------------------------------------------
// wg grid & avg grid
// ---------------------------------------------------------------------------

test('parses 白绿总格数为6格 (grid_wg)', () => {
  const r = parseCentralInfo('白绿总格数为6格');
  assert.equal(r.grid_wg, 6);
});

test('parses 白绿平均格子数为1格 (avg_wg)', () => {
  const r = parseCentralInfo('白绿平均格子数为1格');
  assert.equal(r.avg_wg, 1);
});
