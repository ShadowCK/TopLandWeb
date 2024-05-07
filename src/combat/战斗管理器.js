import _ from 'lodash';
import { DamageSource, DamageType, StatType } from './战斗属性.js';
import { getPlayer } from '../player/玩家管理器.js';
import { 战斗区域, configs } from './战斗区域.js';
import { EventType, HTMLEvents, combatEvents } from '../events/事件管理器.js';
import { gameConfig, 计算区域难度奖励倍率, 计算品质roll点基数 } from '../settings.js';
import { calcHealing, sampleWeighted } from '../utils.js';
import 敌人 from './敌人.js';
import 队友 from './队友.js';
import { ItemType } from '../enums.js';
import { addToWindow } from '../debug.js';

/** @type {战斗区域} */
let 当前战斗区域 = null;

const isPlayerInCombat = () => 当前战斗区域 !== null;

/**
 * @returns {敌人[]} 战斗区域中敌人的array的copy
 */
const getEnemiesInCombat = () => (isPlayerInCombat() ? [...当前战斗区域.敌人] : []);

/**
 * @returns {队友[]} 战斗区域中队友的array的copy
 */
const getAlliesInCombat = () => (isPlayerInCombat() ? [...当前战斗区域.队友] : []);

const getEntitiesInCombat = (includePlayer = true) => {
  if (!isPlayerInCombat()) {
    return [];
  }
  return includePlayer
    ? [getPlayer(), ...当前战斗区域.敌人, ...当前战斗区域.队友]
    : [...当前战斗区域.敌人, ...当前战斗区域.队友];
};

/** @type {Object<string, 战斗区域>} */
const 所有战斗区域 = {};

// TODO: 可以放到init? 虽然放这里也能用
_.forEach(configs, (config) => {
  所有战斗区域[config.name] = new 战斗区域(config);
});

const get当前战斗区域 = () => 当前战斗区域;

const get战斗区域 = (name) => 所有战斗区域[name];

const isInCombat = (实体) => getEntitiesInCombat().includes(实体);

/**
 * @param {实体} 实体
 * @returns {实体}
 */
const getTarget = (实体) => {
  if (!isPlayerInCombat()) {
    return null;
  }
  const player = getPlayer();
  if (实体 === player || 实体 instanceof 队友) {
    return 当前战斗区域.敌人[0];
  }
  if (实体 instanceof 敌人) {
    return _.sample([player, ...当前战斗区域.队友]);
  }
  throw new Error('Unknown entity type', 实体);
};

/**
 * 判断两个实体是否为盟友
 * @param {实体} caster 施法者
 * @param {实体} target 目标实体
 */
const isAlly = (caster, target) => {
  // 直接返回者和自己是盟友
  if (caster === target) {
    return true;
  }

  // 获取当前玩家实体，避免多次调用
  const player = getPlayer();

  // 检查是否属于同一类或者与玩家是盟友的关系
  return (
    (caster instanceof 敌人 && target instanceof 敌人) ||
    (caster instanceof 队友 && target instanceof 队友) ||
    (caster instanceof 队友 && target === player) ||
    (caster === player && target instanceof 队友)
  );
};
/**
 * @returns {Object<string, {proportion:number, mult: number, totalBonus: number, singleBonus: number}>}}
 */
const 计算伤害分布 = (damageDistribution) => {
  // 去掉伤害分布中值小于等于0的项。理论上可以有负值，但会让机制太过复杂且对玩家不友好
  // 比如，敌人有一个-200%物理伤害分布的技能，玩家的伤害分布是100%物理，50%奥术，那么总伤害直接为负，打不出伤害了。
  // 可以加额外的保护机制，比如totalMult不小于1，也就是伤害分布不会减少总伤害。但这样会让伤害计算过于复杂。而且这样负值就等效于0了。
  const filtered = _.pickBy(damageDistribution, (v) => v > 0);
  const total = _.sum(_.values(filtered));
  const totalBonus = (total > 100 ? (total - 100) * gameConfig.伤害分布总伤害加成 : 0) / 100;
  return _.mapValues(filtered, (v) => {
    // 伤害分布首先会被标准化到100%，然后再计算加成
    const proportion = v / total;
    const singleBonus =
      (v > 100 ? (v - 100) * gameConfig.伤害分布单体伤害加成 : 0) / 100 / proportion;
    return {
      proportion,
      mult: proportion * (1 + totalBonus + singleBonus),
      totalBonus,
      singleBonus,
    };
  });
};

const _计算伤害分布 = (damageDistribution) =>
  _.mapValues(计算伤害分布(damageDistribution), (v) => v.mult);

const 获取伤害分布 = (damageDistribution, damageType, defaultDamageType) => {
  let trueDamageDistribution;
  if (damageDistribution) {
    trueDamageDistribution = _计算伤害分布(damageDistribution);
  } else if (damageType) {
    trueDamageDistribution = { [damageType]: 1 };
  } else {
    trueDamageDistribution = { [defaultDamageType]: 1 };
  }
  return trueDamageDistribution;
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
    damageDistribution: 获取伤害分布(damageDistribution, damageType, DamageType.物理),
  });
};

/**
 * @param {{damager: 实体, damaged: 实体, damage: Number, damageType: string, damageDistribution: Object<string, Number>}} params
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
    damageDistribution: 获取伤害分布(damageDistribution, damageType, DamageType.奥术),
  });
};

const 退出战斗区域 = () => {
  if (!当前战斗区域) {
    return;
  }
  combatEvents.emit(EventType.退出战斗区域, 当前战斗区域);
  // 重置战斗区域
  当前战斗区域.reset();
  当前战斗区域 = null;
  // 清除玩家的攻击计时器
  const player = getPlayer();
  player.攻击计时器 = 0;
};

const 切换战斗区域 = (新区域) => {
  if (!新区域) {
    return;
  }
  退出战斗区域();
  当前战斗区域 = 新区域;
  combatEvents.emit(EventType.进入战斗区域, 新区域);
};

const update = (dt) => {
  if (!isPlayerInCombat()) {
    return;
  }
  // 玩家在战斗中，断言有战斗区域
  当前战斗区域.update(dt);
};

/**
 * @param {实体} entity
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
      damageDistribution: entity.getStat3(StatType.伤害分布, true),
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
    // 注意：这里的攻击已经被伤害事件修改过，因为传入了params给事件，然后解构的params。
    if (damage <= 0) {
      return;
    }

    // 攻击被闪避就不造成伤害
    const 闪避率 = damaged.getStat2(StatType.闪避率, true);
    if (Math.random() < 闪避率 / 100) {
      HTMLEvents.emit(EventType.渲染战斗信息, {
        damager,
        damaged,
        isDodged: true,
      });
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

    const eventData = {
      damager,
      damaged,
      damages: {},
      healing: null,
      isBlocked: false,
      blockRate: 0,
      isCrit: false,
      isDodged: false,
    };

    // 遍历伤害分布，根据不同的伤害类型计算总伤害
    let totalDamage = 0;
    _.forEach(damageDistribution, (mult, type) => {
      let damagePartition = damage * mult;
      // 真实伤害不受抗性和防御力影响
      if (type === DamageType.真实) {
        totalDamage += damagePartition;
        eventData.damages[type] = damagePartition;
        return;
      }
      // 先计算抗性对伤害的影响（先乘算）
      let 伤害抗性 = damaged.getStat2(`${StatType.伤害抗性}.${type}`) || 0;
      let 抗性穿透 = damager.getStat2(`${StatType.抗性穿透}.${type}`) || 0;
      伤害抗性 /= 100;
      抗性穿透 /= 100;
      if (伤害抗性 > 1) {
        // 超过100%的抗性穿透中，100%的抗性穿透会让抗性变成0，剩下的部分作为固定穿透。
        if (抗性穿透 > 1) {
          伤害抗性 = 0;
          伤害抗性 -= 抗性穿透 - 1;
        } else {
          伤害抗性 -= 伤害抗性 * 抗性穿透;
        }
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
        eventData.isCrit = true;
      }
      if (触发格挡) {
        damagePartition *= 格挡倍率;
        eventData.isBlocked = true;
        eventData.blockRate = 格挡率;
      }
      // 计算防御力对伤害的影响（后加算）
      const defensePartition = damaged.getStat2(StatType.防御力) * mult;
      const damageDealt = Math.max(
        ((100 - gameConfig.防御值最多减少伤害百分比) / 100) * damagePartition,
        damagePartition - defensePartition,
      );
      totalDamage += damageDealt;
      eventData.damages[type] = damageDealt;
    });

    // 生命偷取
    const 生命偷取 = (damager.getStat2(StatType.生命偷取, true) / 100) * totalDamage;
    // 实际的治疗值
    const healing = 生命偷取 > 0 ? calcHealing(damager, 生命偷取) : 0;
    if (healing > 0) {
      eventData.healing = healing;
    }
    // 先渲染战斗信息，再造成实际伤害，否则实体死亡->实体被移除->战斗UI被移除，无法渲染战斗信息
    HTMLEvents.emit(EventType.渲染战斗信息, eventData);
    damaged.takeDamage(totalDamage);
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
    if (entity instanceof 队友) {
      // TODO
      return;
    }
    if (entity instanceof 敌人) {
      const 区域难度奖励倍率 = 计算区域难度奖励倍率(当前战斗区域.level);
      const 幸运值 = player.getStat2(StatType.幸运值);
      const 经验值倍率 = 区域难度奖励倍率;
      const 金钱倍率 =
        (1 + (gameConfig.每点幸运值增加金钱百分比 * 幸运值) / 100) * 区域难度奖励倍率;
      const 掉落倍率 = 1 + (gameConfig.每点幸运值增加掉落率百分比 * 幸运值) / 100;
      const 装备品阶 = 当前战斗区域.level;

      // 给予金钱和经验
      player.addExp(entity.经验值 * 经验值倍率 || 0);
      player.金钱 += entity.金钱 * 金钱倍率 || 0;
      // 掉落物品
      entity.config.掉落.forEach((dropConfig) => {
        if (Math.random() * 100 >= dropConfig.chance * 掉落倍率) {
          return;
        }
        const added = player.背包.addItemFromConfig(dropConfig.config, dropConfig.count);
        // * 掉落装备的场合
        if (dropConfig.config.type === ItemType.装备) {
          // 决定装备的品质
          const mapped = _.map(gameConfig.装备稀有度分布, (weight, key) => ({
            weight,
            key,
          }));
          // 不会掉落比重区间低于基数的品质。
          const baseMult = 计算品质roll点基数(幸运值) / 100;
          const rolled = Number(sampleWeighted(mapped, baseMult).key);
          // 重写装备的品质和阶级
          added.forEach(
            /**
             * @param {装备} item
             */
            (item) => {
              item.品质 = rolled;
              item.品阶 = 装备品阶;
              /** @type {更新背包物品事件信息} */
              const eventData = { container: player.背包, index: player.背包.findItemIndex(item) };
              // 重新渲染背包中的装备
              HTMLEvents.emit(EventType.更新背包物品, eventData);
            },
          );
        }
      });
      if (entity.isBoss && 当前战斗区域.isAtMaxLevel()) {
        const success = 当前战斗区域.addMaxLevel(1);
        if (success) {
          HTMLEvents.emit(EventType.区域最大等级提升, 当前战斗区域);
        }
      }
      // 移除敌人
      当前战斗区域.removeEnemy(entity);
    }
  });
};

addToWindow('get当前战斗区域', get当前战斗区域);

export {
  所有战斗区域,
  退出战斗区域,
  切换战斗区域,
  get当前战斗区域,
  get战斗区域,
  update,
  getEnemiesInCombat,
  getAlliesInCombat,
  getEntitiesInCombat,
  updateCombat,
  basicAttack,
  skillDamage,
  isInCombat,
  getTarget,
  registerEvents,
  isPlayerInCombat,
  计算伤害分布,
  isAlly,
};
