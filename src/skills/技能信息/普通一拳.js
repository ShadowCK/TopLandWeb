const 普通一拳 = {
  name: '普通一拳',
  type: '主动 物理',
  maxLevel: 5,
  message: '{caster} 使用了{skill}。',
  description: '对目标造成500%攻击力物理伤害',
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
            counts: 'False',
            key: '普通一拳-攻击力',
            stat: '攻击力',
            formula: 'v*(5+l*0.2)',
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
                'damage-base': '普通一拳-攻击力',
                'damage-scale': '0',
              },
            },
          },
        },
      },
    },
  },
};

export default 普通一拳;
