import { ItemType, EquipSlot } from '../enums.js';

const equipConfigs = {
  // 下水道
  老鼠皮甲: {
    requirements: { level: 3 },
    type: ItemType.装备,
    slot: EquipSlot.胸甲,
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
  金毛鼠尾: {
    requirements: { level: 5 },
    type: ItemType.装备,
    slot: EquipSlot.项链,
    name: '金毛鼠尾',
    description: '幸运鼠的尾巴,据说能带来好运。',
    stats: {
      生命值: 50,
      生命回复效率: 0.05,
      防御力: 5,
      幸运值: 10,
    },
  },
  破碎老鼠王冠: {
    requirements: { level: 5, expertiseLevel: 1 },
    type: ItemType.装备,
    slot: EquipSlot.头盔,
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
      幸运值: 5,
    },
  },
  老鼠王国身份证: {
    requirements: { expertiseLevel: 3 },
    type: ItemType.装备,
    slot: EquipSlot.饰品,
    name: '老鼠王国身份证',
    description: '一张被撕碎的身份证。上面隐约写着老鼠王国的地址。',
    stats: {
      生命回复效率: 0.05,
      魔法回复效率: 0.05,
      攻击间隔: -0.05,
      攻击速度: 0.1,
      攻击力: 5,
      防御力: 5,
      闪避率: 3,
      格挡率: 3,
      格挡伤害: 3,
      伤害抗性: {
        混沌: 20,
      },
      幸运值: 10,
    },
  },
  // 新大陆
  新手木剑: {
    requirements: { level: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
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
    type: ItemType.装备,
    slot: EquipSlot.武器,
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
    type: ItemType.装备,
    slot: EquipSlot.饰品,
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
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '野猪鞭',
    description: '拿在手上意外地沉重，是一件不错的钝器。',
    stats: {
      最大生命值: 40,
      攻击力: 25,
      攻击间隔: 0.18,
      攻击速度: -0.1,
      暴击率: 10,
      暴击伤害: 25,
      格挡率: 5,
      格挡伤害: 5,
      抗性穿透: {
        物理: 12,
      },
      伤害抗性: {
        物理: 5,
      },
    },
  },
  野猪粪: {
    requirements: { level: 1, expertiseLevel: 1 },
    type: ItemType.装备,
    slot: EquipSlot.饰品,
    name: '野猪粪',
    description: '虽然不能吃，涂在身上能让你意外地坚韧。护体屎肤，小子。',
    stats: {
      生命回复: 3,
      生命回复效率: 0.1,
      防御力: 5,
      格挡率: 6,
      格挡伤害: 6,
      幸运值: 4,
    },
  },
  // 蜘蛛洞穴
  蜘蛛护腿: {
    requirements: { level: 15, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.护腿,
    name: '蜘蛛护腿',
    description: '用蜘蛛大兵强韧的蛛丝编织而成。',
    stats: {
      最大生命值: 70,
      生命回复: 4,
      防御力: 5,
      格挡率: 5,
      格挡伤害: 15,
      伤害抗性: {
        自然: 10,
      },
    },
  },
  蜘蛛尖牙: {
    requirements: { level: 15, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '蜘蛛尖牙',
    description: '蜘蛛斥候的牙齿，毒素仍没有褪去。',
    stats: {
      最大生命值: 40,
      生命回复: 3,
      攻击力: 15,
      攻击速度: 0.2,
      暴击率: 15,
      暴击伤害: 10,
      伤害分布: {
        自然: 20,
      },
      抗性穿透: {
        物理: 10,
        自然: 10,
      },
    },
  },
  火焰凝视: {
    requirements: { level: 15, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.头盔,
    name: '火焰凝视',
    description: '聚集了着魔村民怨念的头盔，可以让攻击附加火焰伤害。对蜘蛛特别有效。',
    stats: {
      最大生命值: 30,
      生命回复: 3,
      魔法回复: 3,
      攻击力: 4,
      防御力: 4,
      伤害分布: {
        火焰: 20,
      },
      伤害抗性: {
        火焰: 10,
      },
    },
  },
  结晶足具: {
    requirements: { level: 18, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.鞋子,
    name: '结晶足具',
    description: '用只猪体内凝结的蛛丝晶体制成的鞋子。对自然伤害特别有效。',
    stats: {
      最大生命值: 20,
      生命回复: 3,
      魔法回复: 2,
      防御力: 4,
      伤害抗性: {
        自然: 14,
      },
    },
  },
  忍义手: {
    requirements: { level: 18, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.副手,
    name: '忍义手',
    description: '只狼的忍义手，提供各种战斗支援。',
    stats: {
      最大生命值: 20,
      最大魔法值: 20,
      生命回复: 2,
      魔法回复: 2,
      生命回复效率: 0.05,
      魔法回复效率: 0.05,
      攻击力: 4,
      防御力: 4,
      攻击速度: 0.08,
      闪避率: 10,
      格挡率: 10,
      格挡伤害: 10,
      抗性穿透: {
        物理: 20,
      },
    },
  },
  女皇之泪: {
    requirements: { level: 22, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.戒指,
    name: '女皇之泪',
    description: '蜘蛛女皇临死前留下的一滴泪幻化而成的戒指。',
    stats: {
      最大魔法值: 20,
      魔法回复: 2,
      攻击力: 5,
      暴击率: 5,
      伤害分布: {
        自然: 40,
      },
      格挡伤害: 10,
      抗性穿透: {
        自然: 10,
      },
      幸运值: 3,
    },
  },
  // 永霜要塞
  制式长剑: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '制式长剑',
    description: '使用富有韧性的钢材锻造的军用武器。',
    stats: {
      最大生命值: 60,
      格挡率: 10,
      格挡伤害: 10,
      攻击力: 45,
      攻击速度: 0.1,
      攻击间隔: 0.2,
      暴击率: 10,
      暴击伤害: 20,
      伤害分布: {
        物理: 10,
        冰霜: 20,
      },
      抗性穿透: {
        物理: 10,
        冰霜: 10,
      },
      伤害抗性: {
        冰霜: 15,
        火焰: 5,
      },
    },
  },
  制式法杖: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '制式法杖',
    description: '使用富有韧性的钢材锻造的军用武器。',
    stats: {
      最大生命值: 35,
      最大魔法值: 40,
      魔法回复: 5,
      攻击力: 35,
      攻击速度: 0.13,
      暴击率: 10,
      暴击伤害: 20,
      伤害分布: {
        奥术: 10,
        冰霜: 20,
      },
      抗性穿透: {
        物理: 10,
        冰霜: 10,
      },
      伤害抗性: {
        冰霜: 15,
        火焰: 5,
      },
    },
  },
  霜铠重覆: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.鞋子,
    name: '霜铠重覆',
    description: '复杂的符文雕刻抑制了你的魔力，但提供了优秀的抗性。',
    stats: {
      最大生命值: 50,
      生命回复: 8,
      魔法回复: -4,
      防御力: 13,
      格挡率: 5,
      伤害抗性: {
        物理: 5,
        奥术: 5,
        火焰: 2,
        冰霜: 8,
      },
    },
  },
  凝冰利匕: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '凝冰利匕',
    description: '在外人眼中，这就是一根大冰锥。但你知道它的真正用途。',
    stats: {
      攻击力: 15,
      攻击间隔: -0.16,
      攻击速度: 0.25,
      暴击率: 13,
      暴击伤害: 25,
      伤害分布: {
        物理: 10,
        冰霜: 30,
      },
      抗性穿透: {
        物理: 6,
        冰霜: 6,
      },
    },
  },
  冰霜之心: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.胸甲,
    name: '冰霜之心',
    description: '隔壁英雄联盟设计师看到这件装备后选择了沉默。',
    stats: {
      最大生命值: 80,
      魔法回复: 4,
      攻击力: 5,
      防御力: 22,
      格挡率: 5,
      格挡伤害: 10,
      伤害抗性: {
        物理: 5,
        奥术: 5,
        冰霜: 10,
      },
    },
  },
  冰冻牢笼: {
    requirements: { level: 40 },
    type: ItemType.装备,
    slot: EquipSlot.副手,
    name: '冰冻牢笼',
    description: '寒霜王朝赐予高阶战士的烙印，拥有它的代价是永恒的忠诚。',
    stats: {
      生命回复: 12,
      生命回复效率: 0.12,
      魔法回复效率: 0.12,
      防御力: 15,
      伤害分布: {
        冰霜: 40,
      },
      伤害抗性: {
        物理: 6,
        奥术: 6,
        火焰: 8,
        冰霜: 12,
      },
    },
  },
  雪域冰冠: {
    requirements: { level: 35, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.头盔,
    name: '雪域冰冠',
    description: '寒霜王朝的人并非天生不怕冷，他们需要火炉、热水袋和这顶冰冠。',
    stats: {
      最大生命值: 55,
      生命回复: 8,
      防御力: 16,
      伤害抗性: {
        物理: 8,
        火焰: 8,
        冰霜: 15,
      },
    },
  },
  永霜: {
    requirements: {},
    type: ItemType.装备,
    slot: EquipSlot.饰品,
    name: '永霜',
    description: '将永霜要塞的士兵永远禁锢在忠诚诅咒中的魔能核心。',
    stats: {
      伤害分布: {
        冰霜: 100,
      },
      伤害抗性: {
        火焰: 10,
        冰霜: 25,
      },
    },
  },
  // 燃烧古堡
  火焰结晶: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.饰品,
    name: '火焰结晶',
    description: '尸体中发掘的能量晶体，对火焰有奇特的防御能力。',
    stats: {
      最大魔法值: 30,
      魔法回复: 3,
      攻击力: 12,
      暴击伤害: 15,
      伤害分布: {
        火焰: 33,
      },
      抗性穿透: {
        火焰: 6,
      },
      伤害抗性: {
        冰霜: 5,
        火焰: 15,
      },
    },
  },
  燃烧束衣: {
    requirements: { level: 30, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.胸甲,
    name: '燃烧束衣',
    description: '火焰加注吾身，当所向披靡。',
    stats: {
      最大生命值: 120,
      生命回复: 6,
      生命回复效率: 0.1,
      攻击力: 18,
      防御力: -6,
      格挡率: 4,
      格挡伤害: 12,
      伤害抗性: {
        冰霜: 5,
        火焰: 20,
      },
    },
  },
  尸炎心脏: {
    requirements: { level: 40, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.饰品,
    name: '尸炎心脏',
    description: '在火焰烧灼下仍蓬勃跳动的心脏。',
    stats: {
      最大生命值: 50,
      最大魔法值: 30,
      生命回复: 10,
      魔法回复: 5,
      生命回复效率: 0.15,
      伤害抗性: {
        物理: 12,
        奥术: 12,
        火焰: 25,
      },
      幸运值: -5,
    },
  },
  燃烧巨剑: {
    requirements: { level: 40, expertiseLevel: 2 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
    name: '燃烧巨剑',
    description: '很强，但是很重。你需要考虑一下到底需不需要它……',
    stats: {
      最大生命值: 150,
      攻击力: 135,
      攻击间隔: 0.4,
      暴击率: 12,
      暴击伤害: 40,
      格挡率: 6,
      格挡伤害: 20,
      伤害分布: {
        物理: 30,
        火焰: 120,
      },
      抗性穿透: {
        物理: 8,
        火焰: 12,
      },
    },
  },
  生命源泉: {
    requirements: { level: 50, expertiseLevel: 3 },
    type: ItemType.装备,
    slot: EquipSlot.副手,
    name: '生命源泉',
    description: '它能大幅增强你的生命力，但是邪恶禁忌的力量缠绕着它。',
    stats: {
      最大生命值: 500,
      生命回复: 80,
      生命回复效率: 0.6,
      攻击力: -100,
      防御力: -20,
      攻击速度: -0.2,
      暴击率: -10,
      暴击伤害: -25,
      幸运值: -10,
    },
  },

  // 装备模板
  _装备模板: {
    requirements: { level: 1, expertiseLevel: 1 },
    type: ItemType.装备,
    slot: EquipSlot.武器,
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

export { equipConfigs };
