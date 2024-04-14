import EventEmitter from 'eventemitter3';
import { damageSources } from './战斗属性.js';

const combatEvents = new EventEmitter();

const basicAttack = (damager, damaged) => {
  combatEvents.emit('实体攻击实体', {
    damager,
    damaged,
    damage: damager.getStat('攻击力'),
    damageSource: damageSources.普攻,
  });
};

const skillDamage = (damager, damaged, damage) => {
  combatEvents.emit('实体攻击实体', {
    damager,
    damaged,
    damage,
    damageSource: damageSources.技能,
  });
};

combatEvents.on('实体攻击实体', (args) => {
  const { damager, damaged, damage, damageSource } = args;
  // TODO: 伤害计算
});
// 攻击事件
combatEvents.on('entity-damage-by-entity', () => {});

export default combatEvents;
