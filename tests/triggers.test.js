import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasEndPrompt,
  hasAuctionLobby,
  hasRewardContinue,
  hasHomeBidButton,
  parseRoundNumber,
} from '../ui/triggers.js';

// ---------------------------------------------------------------------------
// hasEndPrompt
// ---------------------------------------------------------------------------
test('hasEndPrompt detects 对局结束 (direct)', () => {
  assert.equal(hasEndPrompt('恭喜你！对局结束 你赢了'), true);
});

test('hasEndPrompt detects 本局结束', () => {
  assert.equal(hasEndPrompt('本局结束，结算中'), true);
});

test('hasEndPrompt detects split 对局 + 结束', () => {
  // OCR may insert spaces between characters
  assert.equal(hasEndPrompt('对 局 已经 结 束'), true);
});

test('hasEndPrompt returns false for unrelated text', () => {
  assert.equal(hasEndPrompt('回合开始，请出价'), false);
  assert.equal(hasEndPrompt(''), false);
});

// ---------------------------------------------------------------------------
// hasAuctionLobby
// ---------------------------------------------------------------------------
test('hasAuctionLobby detects 竞拍大厅 (direct)', () => {
  assert.equal(hasAuctionLobby('欢迎进入竞拍大厅'), true);
});

test('hasAuctionLobby detects 选择拍场', () => {
  assert.equal(hasAuctionLobby('选择拍场'), true);
});

test('hasAuctionLobby detects split 竞拍 + 大厅', () => {
  assert.equal(hasAuctionLobby('竞拍 大厅'), true);
});

test('hasAuctionLobby returns false for unrelated text', () => {
  assert.equal(hasAuctionLobby('出价确认'), false);
});

// ---------------------------------------------------------------------------
// hasRewardContinue
// ---------------------------------------------------------------------------
test('hasRewardContinue detects EXP + 继续', () => {
  assert.equal(hasRewardContinue('获得 EXP x500  继续'), true);
});

test('hasRewardContinue is case-insensitive on EXP', () => {
  assert.equal(hasRewardContinue('exp 领取 继续'), true);
});

test('hasRewardContinue returns false when 继续 is absent', () => {
  assert.equal(hasRewardContinue('EXP x100'), false);
});

test('hasRewardContinue returns false when EXP is absent', () => {
  assert.equal(hasRewardContinue('继续竞拍'), false);
});

// ---------------------------------------------------------------------------
// hasHomeBidButton
// ---------------------------------------------------------------------------
test('hasHomeBidButton detects 竞拍', () => {
  assert.equal(hasHomeBidButton('进入竞拍'), true);
});

test('hasHomeBidButton returns false without 竞拍', () => {
  assert.equal(hasHomeBidButton('主页'), false);
  assert.equal(hasHomeBidButton(''), false);
});

// ---------------------------------------------------------------------------
// parseRoundNumber
// ---------------------------------------------------------------------------
test('parseRoundNumber extracts Arabic numerals (第1轮)', () => {
  assert.equal(parseRoundNumber('第1轮竞价'), 1);
});

test('parseRoundNumber extracts with space (第 3 轮)', () => {
  assert.equal(parseRoundNumber('第 3 轮 出价'), 3);
});

test('parseRoundNumber extracts Chinese numerals (第二轮)', () => {
  assert.equal(parseRoundNumber('第二轮开始'), 2);
});

test('parseRoundNumber extracts 回合 pattern (第5回合)', () => {
  assert.equal(parseRoundNumber('第5回合'), 5);
});

test('parseRoundNumber returns null when no round is found', () => {
  assert.equal(parseRoundNumber('没有轮次信息'), null);
  assert.equal(parseRoundNumber(''), null);
});

test('parseRoundNumber rejects out-of-range rounds (0, 6)', () => {
  // "第6轮" should return null (out of 1-5 range)
  assert.equal(parseRoundNumber('第6轮'), null);
});
