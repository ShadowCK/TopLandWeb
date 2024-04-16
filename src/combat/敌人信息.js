const enemyConfigs = {
  老鼠: {
    // 其实就是职业信息，但是是给敌人用的
    职业: {
      requirements: {},
      name: '老鼠',
      description: '一拳就能揍死的老鼠。鼠鼠我啊，真的是鼠鼠我啊。',
      maxLevel: 1,
      statGrowth: {
        最大生命值: [1, 0],
        最大魔法值: [1, 0],
        生命回复: [1, 0],
        魔法回复: [0, 0],
        生命回复效率: [1, 0],
        魔法回复效率: [1, 0],
        攻击力: [1, 0],
        防御力: [0, 0],
        攻击间隔: [1, 0],
        攻击速度: [1, 0],
        暴击率: [0, 0],
        暴击伤害: [150, 0],
        闪避率: [0, 0],
        格挡率: [0, 0],
        格挡伤害: [0, 0],
        伤害抗性: {
          物理: [10, 0],
        },
        抗性穿透: {
          物理: [10, 0],
        },
        生命偷取: [0, 0],
        技能急速: [0, 0],
        幸运值: [0, 0],
        最大魔典数: [0, 0],
      },
    },
    掉落: {},
    金钱: 0,
    经验值: 1,
  },
  菜鸡魔能使: {
    职业: {
      requirements: {},
      name: '菜鸡魔能使',
      description: '刚学会挥舞法杖的菜鸡魔能使，他其实不会魔法。',
      maxLevel: 1,
      statGrowth: {
        最大生命值: [50, 0],
        最大魔法值: [100, 0],
        生命回复: [1, 0],
        魔法回复: [1, 0],
        生命回复效率: [1, 0],
        魔法回复效率: [1, 0],
        攻击力: [5, 0],
        防御力: [2, 0],
        攻击间隔: [1.2, 0],
        攻击速度: [1, 0],
        暴击率: [0, 0],
        暴击伤害: [150, 0],
        闪避率: [0, 0],
        格挡率: [0, 0],
        格挡伤害: [0, 0],
        伤害抗性: {
          物理: [-10, 0],
          奥术: [10, 0],
          冰霜: [10, 0],
          火焰: [10, 0],
          自然: [10, 0],
          神圣: [10, 0],
          暗影: [10, 0],
        },
        抗性穿透: {
          奥术: [10, 0],
        },
        生命偷取: [0, 0],
        技能急速: [0, 0],
        幸运值: [0, 0],
        最大魔典数: [0, 0],
      },
    },
    掉落: {},
    金钱: 10,
    经验值: 10,
  },
  新手剑士: {
    职业: {
      requirements: {},
      name: '新手剑士',
      description: '皮糙肉厚的倒霉蛋。',
      maxLevel: 1,
      statGrowth: {
        最大生命值: [70, 0],
        最大魔法值: [20, 0],
        生命回复: [1, 0],
        魔法回复: [1, 0],
        生命回复效率: [1, 0],
        魔法回复效率: [1, 0],
        攻击力: [12, 0],
        防御力: [5, 0],
        攻击间隔: [1.5, 0],
        攻击速度: [1, 0],
        暴击率: [10, 0],
        暴击伤害: [150, 0],
        闪避率: [0, 0],
        格挡率: [10, 0],
        格挡伤害: [10, 0],
        伤害抗性: {
          物理: [10, 0],
          奥术: [-10, 0],
          冰霜: [-10, 0],
          火焰: [-10, 0],
          自然: [-10, 0],
          神圣: [-10, 0],
          暗影: [-10, 0],
        },
        抗性穿透: {
          物理: [10, 0],
        },
        生命偷取: [0, 0],
        技能急速: [0, 0],
        幸运值: [0, 0],
        最大魔典数: [0, 0],
      },
    },
    掉落: {},
    金钱: 10,
    经验值: 20,
  },
  装逼的骑士: {
    requirements: {},
    name: '装逼的骑士',
    description: '他的骑士资格是开后门拿到的，但仍然有点实力。',
    maxLevel: 1,
    statGrowth: {
      最大生命值: [250, 0],
      最大魔法值: [50, 0],
      生命回复: [10, 0],
      魔法回复: [0, 0],
      生命回复效率: [1, 0],
      魔法回复效率: [1, 0],
      攻击力: [25, 0],
      防御力: [10, 0],
      攻击间隔: [1.2, 0],
      攻击速度: [1, 0],
      暴击率: [20, 0],
      暴击伤害: [150, 0],
      闪避率: [0, 0],
      格挡率: [10, 0],
      格挡伤害: [10, 0],
      伤害抗性: {
        物理: [10, 0],
        奥术: [-10, 0],
        冰霜: [-10, 0],
        火焰: [-10, 0],
        自然: [-10, 0],
        神圣: [-10, 0],
        暗影: [-10, 0],
      },
      抗性穿透: {
        物理: [10, 0],
      },
      生命偷取: [0, 0],
      技能急速: [0, 0],
      幸运值: [0, 0],
      最大魔典数: [0, 0],
    },
    掉落: {},
    金钱: 100,
    经验值: 1000,
  },
};

export default enemyConfigs;
