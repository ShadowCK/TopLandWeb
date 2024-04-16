import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import { damageSources, damageTypes, statTypes } from './战斗属性.js';
import { getPlayer } from '../player/玩家管理器.js';

const combatEvents = new EventEmitter();

/** @type {import('./战斗区域.js').战斗区域} */
let 战斗区域 = null;

const isPlayerInCombat = () => 战斗区域 !== null;

/**
 * @returns {import('./敌人.js'.default)[]} 战斗区域中敌人的array的copy
 */
const getEnemiesInCombat = () => (isPlayerInCombat() ? [...战斗区域.敌人] : []);

const getEntitiesInCombat = () => {
  if (!isPlayerInCombat()) {
    return [];
  }
  return [getPlayer(), ...战斗区域.敌人];
};

const init = () => {
  // Do nothing for now
  // TODO: is this necessary?
};

const isInCombat = (实体) => getEntitiesInCombat().includes(实体);

const getTarget = (实体) => {
  const player = getPlayer();
  if (实体 === player) {
    return 战斗区域.敌人[0];
  }
  return player;
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

const 切换战斗区域 = (新区域) => {
  if (新区域) {
    战斗区域 = 新区域;
    return;
  }
  // 退出战斗区域
  战斗区域 = null;
};

const update = (dt) => {
  if (!isPlayerInCombat()) {
    return;
  }
  // 玩家在战斗中，断言有战斗区域
  战斗区域.update(dt);
};

const updateCombat = (entity, dt) => {
  if (!isInCombat(entity)) {
    return;
  }
  const target = getTarget(entity);
  if (!target) {
    return;
  }
  // 填充攻击计时器
  const 攻击速度 = Math.max(0, entity.getStat(statTypes.攻击速度) / 100);
  entity.攻击计时器 += dt * 攻击速度;
  if (entity.攻击计时器 >= entity.getStat(statTypes.攻击间隔, true)) {
    entity.攻击计时器 = 0;
    basicAttack({
      damager: entity,
      damaged: target,
      damageType: '物理', // TODO: 以后会给实体加入伤害类型（伤害分布）
    });
  }

  // TODO: 更新技能CD
  // TODO: 如果自动施法打开，并且有技能可用，自动使用技能
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
  const 闪避率 = damaged.getStat2(statTypes.闪避率, true);
  if (Math.random() < 闪避率 / 100) {
    return;
  }

  // 计算暴击（暴击不分开计算）
  const 暴击率 = damager.getStat(statTypes.暴击率);
  const 造成暴击 = Math.random() < 暴击率 / 100;
  // 超过100%的每点暴击率增加1%暴击伤害。
  const 暴击倍率 = (damager.getStat(statTypes.暴击伤害) + Math.min(0, 暴击率 - 100)) / 100;

  // 计算格挡（格挡不分开计算）
  const 格挡率 = damaged.getStat2(statTypes.格挡率, true);
  const 触发格挡 = Math.random() < 格挡率 / 100;
  const 格挡倍率 = 1 - damaged.getStat2(statTypes.格挡伤害, true) / 100;

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
  const 生命偷取 = (damager.getStat2(statTypes.生命偷取, true) / 100) * totalDamage;
  damager.heal(生命偷取);
});

export {
  切换战斗区域,
  update,
  getEnemiesInCombat,
  getEntitiesInCombat,
  updateCombat,
  init,
  basicAttack,
  skillDamage,
  isInCombat,
  getTarget,
  combatEvents,
};
