import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import { damageSources, damageTypes, statTypes } from './战斗属性.js';

const combatEvents = new EventEmitter();

const basicAttack = (params) => {
  const { damager, damaged, damageType, damageDistribution } = params;
  if (!damager || !damaged) {
    console.error('damager or damaged is not defined');
    return;
  }
  combatEvents.emit('实体攻击实体', {
    damager,
    damaged,
    damage: damager.getStat(statTypes.攻击力),
    damageSource: damageSources.普攻,
    damageDistribution:
      damageDistribution || damageType ? { [damageType]: 1 } : { [damageTypes.物理]: 1 },
  });
};

const skillDamage = (params) => {
  const { damager, damaged, damage, damageType, damageDistribution } = params;
  if (!damager || !damaged) {
    console.error('damager or damaged is not defined');
    return;
  }
  if (damage == null || damage <= 0) {
    console.error('damage must be a positive number');
    return;
  }
  if (!damageType && !damageDistribution) {
    console.error('Either damageType or damageDistribution must be defined');
    return;
  }
  combatEvents.emit('实体攻击实体', {
    damager,
    damaged,
    damage: damager.calcStat(damage, statTypes.攻击力), // 技能伤害享受攻击力Buff
    damageSource: damageSources.技能,
    damageDistribution: damageDistribution || { [damageType]: 1 },
  });
};

// 计算伤害
combatEvents.on('实体攻击实体', (params) => {
  // 先触发技能效果，再计算最终伤害（技能效果可能会影响伤害）
  if (params.damageSource === damageSources.普攻) {
    combatEvents.emit('普攻伤害事件', params);
  } else if (params.damageSource === damageSources.技能) {
    combatEvents.emit('技能伤害事件', params);
  }

  const { damager, damaged, damageDistribution } = params;
  const { damage } = params;

  // 遍历伤害分布，根据不同的伤害类型计算总伤害
  let totalDamage = 0;
  _.forEach(damageDistribution, (type, mult) => {
    let damagePartition = damage * mult;
    // 真实伤害不受抗性和防御力影响
    if (type === damageTypes.真实) {
      totalDamage += damagePartition;
      return;
    }
    // 先计算抗性对伤害的影响（先乘算）
    let 伤害抗性 = damaged.getStat(`${statTypes.伤害抗性}.${type}`) || 0;
    let 抗性穿透 = damager.getStat(`${statTypes.抗性穿透}.${type}`) || 0;
    伤害抗性 /= 100;
    抗性穿透 /= 100;
    if (伤害抗性 > 1) {
      伤害抗性 -= 伤害抗性 * 抗性穿透;
    } else {
      伤害抗性 -= 抗性穿透;
    }
    // 神圣伤害的抗性上限更低（伤害更高）
    const 抗性上限 = type === damageTypes.神圣 ? 0.5 : 0.8;
    if (伤害抗性 <= 抗性上限) {
      damagePartition *= 1 - 伤害抗性;
    } else {
      // 每点抗性-1%伤害，超过上限的每点抗性等效增加1%生命值
      damagePartition *= (1 - 抗性上限) / (1 + 伤害抗性 - 抗性上限);
    }
    // 计算防御力对伤害的影响（后加算）
    const defensePartition = damaged.getStat(statTypes.防御力) * mult;
    totalDamage += damagePartition - defensePartition;
  });
  return totalDamage;
});

export { combatEvents, basicAttack, skillDamage };
