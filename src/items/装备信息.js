const EquipType = {
  武器: '武器',
  副手: '副手',
  头盔: '头盔',
  胸甲: '胸甲',
  护腿: '护腿',
  鞋子: '鞋子',
  项链: '项链',
  戒指: '戒指',
  饰品: '饰品',
};

const equipConfigs = {
  // 下水道
  老鼠皮甲: {
    requirements: { level: 3 },
    type: EquipType.胸甲,
    name: '老鼠皮甲',
    description: '用老鼠皮做成的胸甲。',
    stats: {
      最大生命值: 30,
      生命回复: 1,
      防御力: 2,
      格挡率: 10,
      格挡伤害: 5,
      伤害抗性: {
        物理: 5,
      },
    },
  },
  破碎老鼠王冠: {
    requirements: { level: 5, expertiseLevel: 1 },
    type: EquipType.头盔,
    name: '破碎老鼠王冠',
    description: '下水道里老鼠国王的王冠。种种证据显示它不是真正的国王。',
    stats: {
      最大生命值: 60,
      最大魔法值: 10,
      生命回复: 4,
      魔法回复: 1,
      生命回复效率: 0.05,
      魔法回复效率: 0.01,
      防御力: 5,
      伤害抗性: {
        物理: 10,
        混沌: 10,
      },
      幸运值: 3,
    },
  },
  老鼠王国身份证: {
    requirements: { expertiseLevel: 3 },
    type: EquipType.饰品,
    name: '老鼠王国身份证',
    description: '一张被撕碎的身份证。上面隐约写着老鼠王国的地址。',
    stats: {
      生命回复效率: 0.05,
      魔法回复效率: 0.05,
      攻击力: 3,
      防御力: 3,
      闪避率: 2,
      格挡率: 2,
      格挡伤害: 2,
      伤害抗性: {
        混沌: 20,
      },
      幸运值: 10,
    },
  },
  // 新大陆
  新手木剑: {
    requirements: { level: 2 },
    type: EquipType.武器,
    name: '新手木剑',
    description: '一把普通的木剑。',
    stats: {
      最大生命值: 20,
      攻击力: 5,
      攻击速度: 0.1,
      暴击伤害: 10,
      抗性穿透: {
        物理: 5,
      },
    },
  },
  铁剑: {
    requirements: { level: 8 },
    type: EquipType.武器,
    name: '铁剑',
    description: '一把像样的铁剑。',
    stats: {
      最大生命值: 20,
      攻击力: 10,
      攻击间隔: -0.05,
      攻击速度: 0.1,
      暴击伤害: 10,
      格挡率: 3,
      格挡伤害: 3,
      抗性穿透: {
        物理: 5,
      },
    },
  },
  // 科科猪场
  魔法水晶碎片: {
    requirements: { level: 8 },
    type: EquipType.饰品,
    name: '魔法水晶碎片',
    description: '一些劣等魔法生物的生命结晶。可以增幅你的法力。',
    stats: {
      最大魔法值: 50,
      魔法回复: 5,
      攻击力: 4,
      抗性穿透: {
        奥术: 5,
        冰霜: 3,
        火焰: 3,
        自然: 3,
      },
      伤害抗性: {
        奥术: 5,
        冰霜: 3,
        火焰: 3,
        自然: 3,
      },
    },
  },
  野猪鞭: {
    requirements: { level: 10 },
    type: EquipType.武器,
    name: '野猪鞭',
    description: '拿在手上意外地沉重，是一件不错的钝器。',
    stats: {
      最大生命值: 40,
      攻击力: 20,
      攻击间隔: 0.2,
      攻击速度: -0.1,
      暴击率: 10,
      暴击伤害: 20,
      格挡率: 5,
      格挡伤害: 5,
      抗性穿透: {
        物理: 7,
      },
      伤害抗性: {
        物理: 5,
      },
    },
  },
  野猪粪: {
    requirements: { level: 1, expertiseLevel: 1 },
    type: EquipType.饰品,
    name: '野猪粪',
    description: '虽然不能吃，涂在身上能让你意外地坚韧。护体屎肤，小子。',
    stats: {
      生命回复: 2,
      生命回复效率: 0.1,
      防御力: 5,
      闪避率: 2,
      格挡率: 2,
      格挡伤害: 4,
      幸运值: 4,
    },
  },

  // 装备模板
  _装备模板: {
    requirements: { level: 1, expertiseLevel: 1 },
    type: EquipType.武器,
    name: '新手木剑',
    description: '一把普通的木剑。',
    stats: {
      最大生命值: 20,
      最大魔法值: 0,
      生命回复: 0,
      魔法回复: 0,
      生命回复效率: 0,
      魔法回复效率: 0,
      攻击力: 5,
      防御力: 0,
      攻击间隔: 0,
      攻击速度: 0.1,
      暴击率: 5,
      暴击伤害: 10,
      闪避率: 0,
      格挡率: 0,
      格挡伤害: 0,
      伤害抗性: {},
      抗性穿透: {
        物理: 5,
      },
      生命偷取: 0,
      技能急速: 0,
      幸运值: 0,
      最大魔典数: 0,
    },
  },
};

export { EquipType, equipConfigs };
