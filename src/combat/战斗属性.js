/**
 * 只包含可以被增幅的属性，不包括生命值，魔法值等属性
 */
const StatType = {
  最大生命值: '最大生命值',
  最大魔法值: '最大魔法值',
  生命回复: '生命回复',
  魔法回复: '魔法回复',
  生命回复效率: '生命回复效率',
  魔法回复效率: '魔法回复效率',
  攻击力: '攻击力',
  防御力: '防御力',
  攻击间隔: '攻击间隔',
  攻击速度: '攻击速度',
  暴击率: '暴击率',
  暴击伤害: '暴击伤害',
  闪避率: '闪避率',
  格挡率: '格挡率',
  格挡伤害: '格挡伤害',
  伤害抗性: '伤害抗性',
  抗性穿透: '抗性穿透',
  生命偷取: '生命偷取',
  技能急速: '技能急速',
  幸运值: '幸运值',
  最大魔典数: '最大魔典数',
};

const DamageSource = {
  普攻: '普攻', // Basic attack
  技能: '技能', // Skill
};

const DamageType = {
  物理: '物理',
  奥术: '奥术',
  冰霜: '冰霜',
  火焰: '火焰',
  自然: '自然',
  神圣: '神圣',
  暗影: '暗影',
  真实: '真实',
};

// Or defaultStatGrowth
const defaultStats = {
  最大生命值: [100, 5],
  最大魔法值: [100, 5],
  生命回复: [1, 0],
  魔法回复: [1, 0],
  生命回复效率: [1, 0],
  魔法回复效率: [1, 0],
  攻击力: [10, 0.1],
  防御力: [0, 0],
  攻击间隔: [1, 0],
  攻击速度: [1, 0.01],
  暴击率: [0, 0],
  暴击伤害: [150, 0],
  闪避率: [0, 0],
  格挡率: [0, 0],
  格挡伤害: [0, 0],
  伤害抗性: {
    物理: [0, 0],
  },
  抗性穿透: {
    物理: [0, 0],
  },
  生命偷取: [0, 0],
  技能急速: [0, 0],
  幸运值: [0, 0],
  最大魔典数: [1, 0],
};

export { StatType, DamageSource, DamageType, defaultStats };
