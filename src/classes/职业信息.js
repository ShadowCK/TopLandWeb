// Note: 同一阶级的职业攻击、防御的基础和成长应该相同。
// 具体的分化在于抗性、穿透和其他属性。

const classConfigs = {
  初心者: {
    requirements: {},
    name: '初心者',
    description: '初入神域的无名小卒，喜欢用小拳拳暴打敌人。也许会成为一名伟大的英雄。',
    maxLevel: 10,
    statGrowth: {
      最大生命值: [100, 5],
      最大魔法值: [100, 0],
      生命回复: [10, 0],
      魔法回复: [20, 0],
      生命回复效率: [1, 0],
      魔法回复效率: [1, 0],
      攻击力: [10, 1],
      防御力: [0, 0],
      攻击间隔: [1.5, 0],
      攻击速度: [1, 0.02],
      暴击率: [20, 0],
      暴击伤害: [120, 0],
      闪避率: [10, 0],
      格挡率: [10, 0],
      格挡伤害: [10, 0],
      伤害分布: {
        物理: [100, -1],
        真实: [20, 1],
      },
      伤害抗性: {
        物理: [10, 1],
        奥术: [-10, 0],
        冰霜: [-10, 0],
        火焰: [-10, 0],
        自然: [-10, 0],
        神圣: [-10, 0],
        暗影: [-10, 0],
      },
      抗性穿透: {
        物理: [20, 1],
      },
      生命偷取: [0, 0],
      技能急速: [0, 0],
      幸运值: [20, 0],
      最大魔典数: [1, 0],
    },
  },
  剑士: {
    requirements: { 初心者: 1 },
    name: '剑士',
    description: '剑道的修行者，擅长物理攻击和防御。',
    maxLevel: 20,
    statGrowth: {
      最大生命值: [200, 10],
      最大魔法值: [80, 5],
      生命回复: [5, 0.1],
      魔法回复: [5, 0.4],
      生命回复效率: [1.05, 0.01],
      魔法回复效率: [1, 0],
      攻击力: [20, 1.5],
      防御力: [5, 0.2],
      攻击间隔: [1.2, 0],
      攻击速度: [1, 0.02],
      暴击率: [10, 0],
      暴击伤害: [150, 0],
      闪避率: [10, 0],
      格挡率: [20, 0],
      格挡伤害: [10, 0],
      伤害分布: {
        物理: [100, 1],
      },
      伤害抗性: {
        物理: [15, 0.5],
        奥术: [-20, 0],
        冰霜: [-5, 0],
        火焰: [-5, 0],
        自然: [-5, 0],
        神圣: [-5, 0],
        暗影: [-5, 0],
      },
      抗性穿透: {
        物理: [10, 0.2],
      },
      生命偷取: [1, 0],
      技能急速: [0, 0],
      幸运值: [0, 0],
      最大魔典数: [1, 0.01],
    },
  },
  学徒: {
    requirements: { 初心者: 2 },
    name: '学徒',
    description: '魔法的学徒，擅长奥术攻击。可以额外装备一本魔典。',
    maxLevel: 20,
    statGrowth: {
      最大生命值: [150, 8],
      最大魔法值: [150, 10],
      生命回复: [2, 0.1],
      魔法回复: [8, 0.6],
      生命回复效率: [1, 0.01],
      魔法回复效率: [1.2, 0.01],
      攻击力: [20, 1.5],
      防御力: [5, 0.2],
      攻击间隔: [1.5, 0],
      攻击速度: [1, 0.02],
      暴击率: [10, 0],
      暴击伤害: [150, 0],
      闪避率: [5, 0],
      格挡率: [0, 0],
      格挡伤害: [0, 0],
      伤害分布: {
        奥术: [100, 1],
      },
      伤害抗性: {
        物理: [-10, 0],
        奥术: [10, 0.5],
        冰霜: [10, 0.5],
        火焰: [10, 0.5],
        自然: [10, 0.5],
        神圣: [0, 0],
        暗影: [10, 0.5],
      },
      抗性穿透: {
        奥术: [10, 0.2],
      },
      生命偷取: [0, 0],
      技能急速: [5, 0],
      幸运值: [0, 0],
      最大魔典数: [2, 0.01],
    },
  },
  弓箭手: {
    requirements: { 初心者: 3 },
    name: '弓箭手',
    description: '攻击速度快，擅长发现敌人的弱点并造成暴击。偶尔发生的格挡意外地有效。',
    maxLevel: 20,
    statGrowth: {
      最大生命值: [150, 8],
      最大魔法值: [80, 5],
      生命回复: [3, 0.1],
      魔法回复: [5, 0.4],
      生命回复效率: [1.05, 0.01],
      魔法回复效率: [1, 0],
      攻击力: [20, 1.5],
      防御力: [5, 0.2],
      攻击间隔: [1.2, 0],
      攻击速度: [1.2, 0.02],
      暴击率: [15, 0],
      暴击伤害: [175, 0],
      闪避率: [15, 0],
      格挡率: [5, 0],
      格挡伤害: [20, 0],
      伤害分布: {
        物理: [100, 1],
      },
      伤害抗性: {
        物理: [5, 0.5],
        奥术: [-10, 0.5],
        冰霜: [-5, 0],
        火焰: [-5, 0],
        自然: [-5, 0],
        神圣: [-5, 0],
        暗影: [-5, 0],
      },
      抗性穿透: {
        物理: [10, 0.2],
      },
      生命偷取: [0, 0],
      技能急速: [0, 0],
      幸运值: [0, 0],
      最大魔典数: [1, 0.01],
    },
  },
  盗贼: {
    requirements: { 初心者: 4 },
    name: '盗贼',
    description: '极其擅长发动致命的暴击，偷取敌人的生命并逃之夭夭。',
    maxLevel: 20,
    statGrowth: {
      最大生命值: [100, 6],
      最大魔法值: [80, 5],
      生命回复: [4, 0.1],
      魔法回复: [5, 0.4],
      生命回复效率: [1.05, 0.01],
      魔法回复效率: [1, 0],
      攻击力: [20, 1.5],
      防御力: [5, 0.2],
      攻击间隔: [1.2, 0],
      攻击速度: [1.1, 0.01],
      暴击率: [10, 0],
      暴击伤害: [175, 1],
      闪避率: [10, 0],
      格挡率: [10, 0],
      格挡伤害: [10, 0],
      伤害分布: {
        物理: [60, 0.6],
        暗影: [60, 0.6],
      },
      伤害抗性: {
        物理: [5, 0.5],
        奥术: [-10, 0.5],
        冰霜: [-5, 0],
        火焰: [-5, 0],
        自然: [-5, 0],
        神圣: [-5, 0],
        暗影: [-5, 0],
      },
      抗性穿透: {
        物理: [10, 0.5],
      },
      生命偷取: [2, 0],
      技能急速: [0, 0],
      幸运值: [10, 0],
      最大魔典数: [1, 0.01],
    },
  },
  服事: {
    requirements: { 初心者: 5 },
    name: '服事',
    description: '受到上天的召唤，为神圣的事业而战。擅长治疗和驱散负面状态。拥有额外的幸运值。',
    maxLevel: 20,
    statGrowth: {
      最大生命值: [100, 6],
      最大魔法值: [80, 5],
      生命回复: [4, 0.1],
      魔法回复: [5, 0.4],
      生命回复效率: [1.1, 0.02],
      魔法回复效率: [1, 0.01],
      攻击力: [20, 1.5],
      防御力: [5, 0.2],
      攻击间隔: [1.5, 0],
      攻击速度: [1, 0.02],
      暴击率: [10, 0],
      暴击伤害: [150, 0],
      闪避率: [5, 0],
      格挡率: [0, 0],
      格挡伤害: [0, 0],
      伤害分布: {
        奥术: [60, 0.6],
        神圣: [60, 0.6],
      },
      伤害抗性: {
        物理: [-10, 0],
        奥术: [5, 0.5],
        冰霜: [5, 0.5],
        火焰: [5, 0.5],
        自然: [20, 0.5],
        神圣: [10, 0],
        暗影: [-10, 0.5],
      },
      抗性穿透: {
        奥术: [5, 0.2],
        自然: [10, 0.2],
        神圣: [5, 0.2],
      },
      生命偷取: [0, 0],
      技能急速: [5, 0],
      幸运值: [10, 0],
      最大魔典数: [1, 0.01],
    },
  },
};

export default classConfigs;
