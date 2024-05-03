import _ from 'lodash';

const ItemType = {
  物品: '物品',
  装备: '装备',
};

const EquipRarity = {
  粗糙: 0,
  普通: 1,
  优良: 2,
  稀有: 3,
  史诗: 4,
  传说: 5,
  神器: 6,
};

const EquipRarityInverted = _.invert(EquipRarity);

const EquipSlot = {
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

const SemanticUIColor = {
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  olive: 'olive',
  green: 'green',
  teal: 'teal',
  blue: 'blue',
  violet: 'violet',
  purple: 'purple',
  pink: 'pink',
  brown: 'brown',
  grey: 'grey',
  black: 'black',
};

const GameSettingName = {
  HTML更新间隔: 'HTML更新间隔',
  游戏倍速: '游戏倍速',
};

const ComponentType = {
  触发: '触发',
  目标: '目标',
  条件: '条件',
  效果: '效果',
};

const SkillAttribute = {
  COOLDOWN: 'cooldown',
  MANA: 'mana',
  LEVEL: 'level',
};

const BuffType = {
  强乘算: 0,
  弱乘算: 1,
  固定数值: 2,
};

const StackType = {
  无法叠加: 0,
  单独堆叠: 1,
  叠加堆叠: 2,
};

export {
  ItemType,
  EquipSlot,
  SemanticUIColor,
  GameSettingName,
  ComponentType,
  SkillAttribute,
  EquipRarity,
  EquipRarityInverted,
  BuffType,
  StackType,
};
