import _ from 'lodash';
import { DamageSource, DamageType, StatType } from './战斗属性.js';
import { getPlayer } from '../player/玩家管理器.js';
import { 战斗区域, configs } from './战斗区域.js';
import { EventType, combatEvents } from '../events/事件管理器.js';
import { config } from '../settings.js';

/** @type {import('./战斗区域.js').战斗区域} */
let 当前战斗区域 = null;

const isPlayerInCombat = () => 当前战斗区域 !== null;

/**
 * @returns {import('./敌人.js').default[]} 战斗区域中敌人的array的copy
 */
const getEnemiesInCombat = () => (isPlayerInCombat() ? [...当前战斗区域.敌人] : []);

const getEntitiesInCombat = () => {
  if (!isPlayerInCombat()) {
    return [];
  }
  return [getPlayer(), ...当前战斗区域.敌人];
};

/** @type {Object<string, 战斗区域>} */
const 所有战斗区域 = {};

// 可以放到init? 虽然放这里也能用
_.forEach(configs, (config) => {
  所有战斗区域[config.name] = new 战斗区域(config);
});

const get战斗区域 = (name) => 所有战斗区域[name];

const init = () => {
  // Do nothing for now
  // TODO: is this necessary?
};

const isInCombat = (实体) => getEntitiesInCombat().includes(实体);

const getTarget = (实体) => {
  const player = getPlayer();
  if (实体 === player) {
    return 当前战斗区域.敌人[0];
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
  combatEvents.emit(EventType.实体攻击实体, {
    damager,
    damaged,
    damage: damager.getStat2(StatType.攻击力),
    damageSource: DamageSource.普攻,
    damageDistribution:
      damageDistribution || damageType ? { [damageType]: 1 } : { [DamageType.物理]: 1 },
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
  combatEvents.emit(EventType.实体攻击实体, {
    damager,
    damaged,
    damage: damager.calcStat(damage, StatType.攻击力), // 技能伤害享受攻击力Buff
    damageSource: DamageSource.技能,
    damageDistribution: damageDistribution || { [damageType]: 1 },
  });
};

const 退出战斗区域 = () => {
  if (!当前战斗区域) {
    return;
  }
  // 移除敌人
  当前战斗区域.clearEnemies();
  当前战斗区域 = null;
};

const 切换战斗区域 = (新区域) => {
  if (!新区域) {
    return;
  }
  退出战斗区域();
  当前战斗区域 = 新区域;
};

const update = (dt) => {
  if (!isPlayerInCombat()) {
    return;
  }
  // 玩家在战斗中，断言有战斗区域
  当前战斗区域.update(dt);
};

/**
 * @param {import('./实体.js').default} entity
 */
const updateCombat = (entity, dt) => {
  if (entity.isDead) {
    return;
  }
  if (!isInCombat(entity)) {
    return;
  }
  const target = getTarget(entity);
  if (!target) {
    return;
  }
  // 填充攻击计时器
  const 攻击速度 = Math.max(0, entity.getStat2(StatType.攻击速度));
  entity.攻击计时器 += dt * 攻击速度;
  if (entity.攻击计时器 >= entity.getStat2(StatType.攻击间隔, true)) {
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

const registerEvents = () => {
  // 计算伤害
  combatEvents.on(EventType.实体攻击实体, (params) => {
    if (params.damageSource === DamageSource.普攻) {
      // 先触发技能效果，再计算最终伤害（技能效果可能会影响伤害）
      combatEvents.emit(EventType.普攻伤害事件, params);
    } else if (params.damageSource === DamageSource.技能) {
      combatEvents.emit(EventType.技能伤害事件, params);
    }
    // 有些技能可能会取消这次攻击
    if (params.cancelled) {
      return;
    }

    const { damager, damaged, damage, damageDistribution } = params;

    // 攻击被闪避就不造成伤害
    const 闪避率 = damaged.getStat2(StatType.闪避率, true);
    if (Math.random() < 闪避率 / 100) {
      return;
    }

    // 计算暴击（暴击不分开计算）
    const 暴击率 = damager.getStat2(StatType.暴击率);
    const 造成暴击 = Math.random() < 暴击率 / 100;
    // 超过100%的每点暴击率增加1%暴击伤害。
    const 暴击倍率 = (damager.getStat2(StatType.暴击伤害) + Math.min(0, 暴击率 - 100)) / 100;

    // 计算格挡（格挡不分开计算）
    const 格挡率 = damaged.getStat2(StatType.格挡率, true);
    const 触发格挡 = Math.random() < 格挡率 / 100;
    const 格挡倍率 = 1 - damaged.getStat2(StatType.格挡伤害, true) / 100;

    // 遍历伤害分布，根据不同的伤害类型计算总伤害
    let totalDamage = 0;
    _.forEach(damageDistribution, (mult, type) => {
      let damagePartition = damage * mult;
      // 真实伤害不受抗性和防御力影响
      if (type === DamageType.真实) {
        totalDamage += damagePartition;
        return;
      }
      // 先计算抗性对伤害的影响（先乘算）
      let 伤害抗性 = damaged.getStat2(`${StatType.伤害抗性}.${type}`) || 0;
      let 抗性穿透 = damager.getStat2(`${StatType.抗性穿透}.${type}`) || 0;
      伤害抗性 /= 100;
      抗性穿透 /= 100;
      if (伤害抗性 > 1) {
        伤害抗性 -= 伤害抗性 * 抗性穿透;
      } else {
        伤害抗性 -= 抗性穿透;
      }
      // 神圣伤害的抗性上限更低（伤害更高）
      const 抗性上限 = type === DamageType.神圣 ? 0.5 : 0.8;
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
      const defensePartition = damaged.getStat2(StatType.防御力) * mult;
      totalDamage += damagePartition - defensePartition;
    });
    // 对受击者造成伤害
    damaged.takeDamage(totalDamage);
    // 生命偷取
    const 生命偷取 = (damager.getStat2(StatType.生命偷取, true) / 100) * totalDamage;
    damager.heal(生命偷取);
  });

  // 监听实体死亡事件
  combatEvents.on(EventType.实体死亡, ({ entity }) => {
    const player = getPlayer();
    if (entity === player) {
      退出战斗区域();
      // 立刻复活玩家
      // 目前没有死亡惩罚！
      // TODO: 自动前往上次的战斗区域（就是不退出战斗区域）作为一个自动化功能！
      entity.复活();
      return;
    }
    // 给予金钱和经验
    /** @type {import('./敌人.js').default} */
    const 敌人 = entity;
    player.职业.addExp(敌人.经验值 || 0);
    player.金钱 += 敌人.金钱 || 0;
    const 幸运值 = player.getStat2(StatType.幸运值);
    const 掉落倍率 = 1 + (config.每点幸运值增加掉落率百分比 * 幸运值) / 100;
    敌人.掉落.forEach((dropConfig) => {
      if (Math.random() * 100 > dropConfig.chance * 掉落倍率) {
        return;
      }
      player.背包.addItem(dropConfig.itemConfig);
    });
    当前战斗区域.removeEnemy(entity);
  });
};

export {
  所有战斗区域,
  退出战斗区域,
  切换战斗区域,
  get战斗区域,
  update,
  getEnemiesInCombat,
  getEntitiesInCombat,
  updateCombat,
  init,
  basicAttack,
  skillDamage,
  isInCombat,
  getTarget,
  registerEvents,
};

window.当前战斗区域 = () => 当前战斗区域;
