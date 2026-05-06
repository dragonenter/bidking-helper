// data/roi_presets.js
// Source: sarkozyfan/bidking-bot roi_config.json (reference 1924×1127)
// Relative coords (x/W, y/H, w/W, h/H) so they scale to any source resolution.
// Point-only entries (no width/height) are stored with w:0, h:0 and marked point:true.

export const ROI_PRESETS = {
  sarkozyfan_default: {
    label: '1920×1080 标准（sarkozyfan 校准）',
    referenceResolution: { width: 1924, height: 1127 },
    rois: {
      // Round indicator banner at top
      round_banner:              { x: 644/1924,  y: 124/1127,  w: 354/1924,  h: 39/1127  },
      // Main central info / skill popup panel — PRIMARY OCR target
      center_info_panel:         { x: 496/1924,  y: 171/1127,  w: 653/1924,  h: 605/1127 },
      // Loot panel on the right side
      loot_panel:                { x: 1298/1924, y: 142/1127,  w: 604/1924,  h: 839/1127 },
      // Loot price text below loot panel
      loot_price_text:           { x: 1452/1924, y: 949/1127,  w: 329/1924,  h: 35/1127  },
      // Main bid button
      main_bid_button:           { x: 701/1924,  y: 976/1127,  w: 321/1924,  h: 78/1127  },
      // Main bid button center click point (point-only; w/h = 0)
      main_bid_button_center:    { x: 861/1924,  y: 1015/1127, w: 0,          h: 0,          point: true },
      // Tool/item button to the left of bid button
      tool_button:               { x: 581/1924,  y: 978/1127,  w: 103/1924,  h: 104/1127 },
      // Full-width tool strip at the bottom
      tool_strip_panel:          { x: 25/1924,   y: 931/1127,  w: 1845/1924, h: 150/1127 },
      // Bid overlay (number entry panel)
      bid_overlay_panel:         { x: 0/1924,    y: 716/1127,  w: 1396/1924, h: 397/1127 },
      // Keypad within bid overlay
      bid_overlay_keypad:        { x: 31/1924,   y: 768/1127,  w: 692/1924,  h: 324/1127 },
      // Bid input text box
      bid_input_box:             { x: 780/1924,  y: 840/1127,  w: 536/1924,  h: 140/1127 },
      // Confirm bid button
      confirm_bid_button:        { x: 897/1924,  y: 1002/1127, w: 325/1924,  h: 63/1127  },
      // Confirm bid button center click point (point-only; w/h = 0)
      confirm_bid_button_center: { x: 1059/1924, y: 1033/1127, w: 0,          h: 0,          point: true },
      // Close button for bid overlay
      bid_overlay_close_button:  { x: 1409/1924, y: 1051/1127, w: 61/1924,   h: 56/1127  },
      // Full reveal overlay (item reveal screen)
      reveal_overlay_panel:      { x: 243/1924,  y: 242/1127,  w: 1258/1924, h: 644/1127 },
      // Reveal title text
      reveal_title:              { x: 584/1924,  y: 278/1127,  w: 575/1924,  h: 59/1127  },
      // Cards displayed during reveal
      reveal_cards_area:         { x: 348/1924,  y: 462/1127,  w: 779/1924,  h: 359/1127 },
      // Info panel on the right side of reveal screen
      reveal_right_info:         { x: 1176/1924, y: 484/1127,  w: 200/1924,  h: 194/1127 },
    },
  },
};

// The PRIMARY ROI for OCR is `center_info_panel` — the central info / skill popup region.
export const PRIMARY_ROI_KEY = 'center_info_panel';

/**
 * Return the primary OCR ROI (center_info_panel) for a given preset.
 * @param {string} presetKey
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export function getDefaultRoi(presetKey = 'sarkozyfan_default') {
  return ROI_PRESETS[presetKey].rois[PRIMARY_ROI_KEY];
}
