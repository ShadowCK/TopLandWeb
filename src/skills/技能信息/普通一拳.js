const 普通一拳 = {
  name: '普通一拳',
  type: '主动 物理',
  maxLevel: 5,
  message: '{caster} 使用了{skill}。',
  description: '对目标造成500%攻击力物理伤害',
  attributes: {
    'level-base': 25,
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
        Damage: {
          type: '效果',
          data: {
            counts: 'True',
            type: 'percent',
            'damage-type': '物理',
            'damage-base': '500',
            'damage-scale': '100',
          },
        },
      },
    },
  },
};

export default 普通一拳;
