# 竞拍之王仓估值助手 v1

针对 Steam 游戏《竞拍之王》（BidKing）的辅助计算工具，输入角色技能解锁的信息（每轮陆续可见），即时算出当前仓的期望价值、价值区间和出价建议。

## 快速开始（Windows 用户）

下载 `dist/bidking-helper.html`，**双击在浏览器打开即可**。无需安装、无需联网。

## 功能

- 7 个信息型角色：维克托、艾哈迈德（石油哥）、拉文、伊森、伊莎贝拉、艾莎、老头
- 10 大仓品类（家居/医疗/潮流/武器/珠宝/古董/电子/能源/饮食/书画），自动套用对应价值基准
- 5 轮速胜倍率（2.0× / 1.6× / 1.4× / 1.2× / 最高价）
- 实时显示：期望价值、5%-95% 价值区间、出价建议（速胜/保守/激进）、可行组合数

## 数据来源

价值统计来自 [sarkozyfan/bidking-bot](https://github.com/sarkozyfan/bidking-bot) 社区数据。算法移植自 [Oldzc/BidKing-Calculator](https://github.com/Oldzc/BidKing-Calculator) 和 [VCY019/Bid-King-Calculator](https://github.com/VCY019/Bid-King-Calculator)。

## 已知不确定项（v1）

- 角色技能字段映射为社区经验估计，可能与游戏实际有出入
- 10 品类价值数据为社区统计，可能随游戏版本变化
- 单一品质件数上限设为 20（参考 Oldzc 经验）

## 开发

```bash
npm install
npm test                # 单元测试（solver/valuator/bidder）
npm run test:smoke      # Playwright 浏览器冒烟测试
npm run build           # 生成 dist/bidking-helper.html
npm run serve           # 起本地服务器（http://localhost:8765）
```

详见 SPEC.md 和 docs/superpowers/plans/2026-05-05-bidking-helper-v1.md。

## 许可证

MIT
