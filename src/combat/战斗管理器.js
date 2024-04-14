import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import { damageSources, damageTypes, statTypes } from './战斗属性.js';
import * as settings from '../settings.js';
import { getPlayer } from '../player/玩家管理器.js';

const combatEvents = new EventEmitter();

const 战局信息 = {
  玩家: null,
  区域: null,
  敌人: [],
};

const init = () => {
  战局信息.玩家 = getPlayer();
};

const isInCombat = (实体) => {
  // 玩家在战斗中
  if (实体 === getPlayer()) {
    return 实体 === 战局信息.玩家 && 战局信息.敌人.length > 0;
  }
  // 敌人在战斗中
  return 战局信息.敌人.includes(实体);
};

const getTarget = (实体) => {
  if (实体 === getPlayer()) {
    return 战局信息.敌人[0];
  }
  return 战局信息.玩家;
};

/**
 * @param {{damager, damaged, damageType, damageDistribution}} params
 */
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

/**
 * @param {{damager, damaged, damage, damageType, damageDistribution}} params
 */
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
  if (params.damageSource === damageSources.普攻) {
    // 先触发技能效果，再计算最终伤害（技能效果可能会影响伤害）
    combatEvents.emit('普攻伤害事件', params);
  } else if (params.damageSource === damageSources.技能) {
    combatEvents.emit('技能伤害事件', params);
  }
  // 有些技能可能会取消这次攻击
  if (params.cancelled) {
    return;
  }

  const { damager, damaged, damage, damageDistribution } = params;

  // 攻击被闪避就不造成伤害
  const 闪避率 = damaged.getStat(statTypes.闪避率, true, settings.config.statLimits.闪避率);
  if (Math.random() < 闪避率 / 100) {
    return;
  }

  // 计算暴击（暴击不分开计算）
  const 暴击率 = damager.getStat(statTypes.暴击率);
  const 造成暴击 = Math.random() < 暴击率 / 100;
  // 超过100%的每点暴击率增加1%暴击伤害。
  const 暴击倍率 = (damager.getStat(statTypes.暴击伤害) + Math.min(0, 暴击率 - 100)) / 100;

  // 计算格挡（格挡不分开计算）
  const 格挡率 = damaged.getStat(statTypes.格挡率, true, settings.config.statLimits.格挡率);
  const 触发格挡 = Math.random() < 格挡率 / 100;
  const 格挡倍率 =
    1 - damaged.getStat(statTypes.格挡伤害, true, settings.config.statLimits.格挡伤害) / 100;

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
    if (造成暴击) {
      damagePartition *= 暴击倍率;
    }
    if (触发格挡) {
      damagePartition *= 格挡倍率;
    }
    // 计算防御力对伤害的影响（后加算）
    const defensePartition = damaged.getStat(statTypes.防御力) * mult;
    totalDamage += damagePartition - defensePartition;
  });
  // 对受击者造成伤害
  damaged.takeDamage(totalDamage);
  // 生命偷取
  const 生命偷取 =
    (damager.getStat(statTypes.生命偷取, true, settings.config.statLimits.生命偷取) / 100) *
    totalDamage;
  damager.heal(生命偷取);
});

export { init, basicAttack, skillDamage, isInCombat, getTarget, combatEvents };
