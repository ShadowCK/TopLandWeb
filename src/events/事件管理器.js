import EventEmitter from 'eventemitter3';

const EventType = {
  实体攻击实体: '实体攻击实体',
  普攻伤害事件: '普攻伤害事件',
  技能伤害事件: '技能伤害事件',
  实体死亡: '实体死亡',
  生成实体: '生成实体',
  移除实体: '移除实体',
};

const combatEvents = new EventEmitter();

const generalEvents = new EventEmitter();

export { combatEvents, generalEvents, EventType };
