const 爆裂斩 = {
  name: '爆裂斩',
  type: '主动 物理',
  maxLevel: 5,
  message: '{caster} 使用了{skill}。',
  description: '对目标造成1000%攻击力的物理伤害',
  attributes: {
    'level-base': 0,
    'level-scale': 5,
    'cooldown-base': 5,
    'cooldown-scale': 0,
    'mana-base': 40,
    'mana-scale': 8,
  },
  components: {
    Cast: {
      type: '触发',
      data: {},
      children: {
        'Value Stat': {
          type: '效果',
          data: {
            key: '爆裂斩-攻击力',
            stat: '攻击力',
            formula: 'v*10',
          },
        },
        First: {
          type: '目标',
          data: {
            group: 'enemy',
          },
          children: {
            Damage: {
              type: '效果',
              data: {
                counts: 'True',
                type: 'damage',
                'damage-type': '物理',
                'damage-base': '爆裂斩-攻击力',
                'damage-scale': '0',
              },
            },
          },
        },
      },
    },
  },
};

export default 爆裂斩;
