import EventEmitter from 'eventemitter3';

const EventType = {
  // Combat events
  实体攻击实体: '实体攻击实体',
  普攻伤害事件: '普攻伤害事件',
  技能伤害事件: '技能伤害事件',
  实体死亡: '实体死亡',
  生成实体: '生成实体',
  移除实体: '移除实体',
  获得物品: '获得物品',
  失去物品: '失去物品',
  穿上装备: '穿上装备',
  脱下装备: '脱下装备',
  退出战斗区域: '退出战斗区域',
  进入战斗区域: '进入战斗区域',
  // HTML events
  更改设置: '更改设置',
};

const combatEvents = new EventEmitter();

const HTMLEvents = new EventEmitter();

const generalEvents = new EventEmitter();

export { combatEvents, generalEvents, HTMLEvents, EventType };
