// tests/roi_presets.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROI_PRESETS, PRIMARY_ROI_KEY, getDefaultRoi } from '../data/roi_presets.js';

test('default preset exists', () => {
  assert.ok(ROI_PRESETS.sarkozyfan_default);
  assert.equal(typeof ROI_PRESETS.sarkozyfan_default.label, 'string');
});

test('all ROIs are relative (0..1) — rect entries only', () => {
  const rois = ROI_PRESETS.sarkozyfan_default.rois;
  for (const [name, r] of Object.entries(rois)) {
    // Point-only entries have w=0 and h=0 — skip dimension checks for those
    if (r.point) continue;
    assert.ok(r.x >= 0 && r.x <= 1, `${name}.x out of range: ${r.x}`);
    assert.ok(r.y >= 0 && r.y <= 1, `${name}.y out of range: ${r.y}`);
    assert.ok(r.w > 0 && r.w <= 1, `${name}.w out of range: ${r.w}`);
    assert.ok(r.h > 0 && r.h <= 1, `${name}.h out of range: ${r.h}`);
    assert.ok(r.x + r.w <= 1.001, `${name} extends past right edge`);
    assert.ok(r.y + r.h <= 1.001, `${name} extends past bottom edge`);
  }
});

test('center_info_panel exists and is reasonably sized', () => {
  const c = ROI_PRESETS.sarkozyfan_default.rois.center_info_panel;
  assert.ok(c);
  // The skill popup region should be a substantial rectangle (~30%+ of width × ~50%+ of height)
  assert.ok(c.w > 0.2, `center_info_panel.w too small: ${c.w}`);
  assert.ok(c.h > 0.3, `center_info_panel.h too small: ${c.h}`);
});

test('getDefaultRoi returns center_info_panel of default preset', () => {
  const roi = getDefaultRoi();
  const expected = ROI_PRESETS.sarkozyfan_default.rois[PRIMARY_ROI_KEY];
  assert.deepEqual(roi, expected);
});

test('PRIMARY_ROI_KEY is center_info_panel', () => {
  assert.equal(PRIMARY_ROI_KEY, 'center_info_panel');
});

test('preset has all 18 expected ROI keys', () => {
  const rois = ROI_PRESETS.sarkozyfan_default.rois;
  const expectedKeys = [
    'round_banner',
    'center_info_panel',
    'loot_panel',
    'loot_price_text',
    'main_bid_button',
    'main_bid_button_center',
    'tool_button',
    'tool_strip_panel',
    'bid_overlay_panel',
    'bid_overlay_keypad',
    'bid_input_box',
    'confirm_bid_button',
    'confirm_bid_button_center',
    'bid_overlay_close_button',
    'reveal_overlay_panel',
    'reveal_title',
    'reveal_cards_area',
    'reveal_right_info',
  ];
  for (const key of expectedKeys) {
    assert.ok(key in rois, `Missing ROI key: ${key}`);
  }
  assert.equal(Object.keys(rois).length, expectedKeys.length);
});

test('referenceResolution matches source JSON', () => {
  const res = ROI_PRESETS.sarkozyfan_default.referenceResolution;
  assert.equal(res.width, 1924);
  assert.equal(res.height, 1127);
});

test('point-only ROIs have point:true flag and w=h=0', () => {
  const rois = ROI_PRESETS.sarkozyfan_default.rois;
  assert.equal(rois.main_bid_button_center.point, true);
  assert.equal(rois.main_bid_button_center.w, 0);
  assert.equal(rois.main_bid_button_center.h, 0);
  assert.equal(rois.confirm_bid_button_center.point, true);
  assert.equal(rois.confirm_bid_button_center.w, 0);
  assert.equal(rois.confirm_bid_button_center.h, 0);
});

test('getDefaultRoi with explicit preset key works', () => {
  const roi = getDefaultRoi('sarkozyfan_default');
  assert.ok(roi.w > 0.2);
  assert.ok(roi.h > 0.3);
});
