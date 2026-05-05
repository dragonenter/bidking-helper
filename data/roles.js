// data/roles.js
// Source: sarkozyfan ROLE_AUTO_FIELDS + community v1 mapping (subject to user verification)

export const FIELD_LABELS = {
  total_all: '总藏品数',
  victor_total_all: '维克托紫橙红总数',
  total_grid_all: '全仓总格子数',
  count_blue: '蓝色件数',
  count_purple: '紫色件数',
  count_gold: '橙色件数',
  count_red: '红色件数',
  grid_blue: '蓝色总格数',
  grid_purple: '紫色总格数',
  grid_gold: '橙色总格数',
  grid_red: '红色总格数',
  avg_blue: '蓝色均格',
  avg_purple: '紫色均格',
  avg_gold: '橙色均格',
  avg_red: '红色均格',
  count_green: '绿色件数',
  count_white: '白色件数',
  wg_total: '绿白总数',
  highest_quality: '最高品质',
};

export const ROLES = {
  victor: {
    label: '维克托',
    fieldsByRound: {
      1: ['victor_total_all'],
      2: [], 3: [], 4: [], 5: [],
    },
  },
  ahmad: {
    label: '艾哈迈德（石油哥）',
    fieldsByRound: {
      1: ['total_all'],
      2: ['avg_gold'],
      3: ['avg_purple'],
      4: ['avg_blue'],
      5: ['wg_total'],
    },
  },
  lavin: {
    label: '拉文',
    fieldsByRound: {
      1: [], 2: [], 3: [], 4: [],
      5: ['count_blue', 'count_purple', 'count_gold', 'count_red', 'wg_total'],
    },
  },
  ethan: {
    label: '伊森',
    fieldsByRound: {
      1: ['total_grid_all'],
      2: [], 3: [], 4: [], 5: [],
    },
  },
  isabella: {
    label: '伊莎贝拉',
    fieldsByRound: {
      1: ['highest_quality'],
      2: [], 3: [], 4: [], 5: [],
    },
  },
  aisha: {
    label: '艾莎',
    fieldsByRound: {
      1: [], 2: [], 3: [],
      4: ['count_red', 'count_gold'],
      5: [],
    },
  },
  oldman: {
    label: '老头',
    fieldsByRound: {
      1: ['victor_total_all', 'avg_purple', 'avg_gold'],
      2: [], 3: [], 4: [], 5: [],
    },
  },
};
