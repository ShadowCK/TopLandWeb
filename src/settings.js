import _ from 'lodash';
import * as math from 'mathjs';
import { addToWindow, isProduction } from './debug.js';

// 计算实际属性时，基础值、Buff等加成的应用顺序
const 默认优先级 = {
  基础值: 100,
  强乘算: 200,
  弱乘算: 300,
  固定数值: 400,
};

// 游戏的重要参数，不应该在游戏过程中被修改。
// alias: gameConfig
const config = {
  extraLevelsPerExpertiseLevel: 5,
  statLimits: {
    攻击间隔: { min: 0.1, max: Infinity },
    攻击速度: { min: 0, max: Infinity },
    闪避率: { min: 0, max: 80 },
    格挡率: { min: 0, max: 100 },
    格挡伤害: { min: 0, max: 95 },
    生命偷取: { min: 0, max: Infinity },
  },
  最大敌人数: 3,
  最大队友数: 2,
  刷怪间隔: 5,
  无敌人刷怪倍速: 10,
  必定刷新BOSS刷怪数量: 20,
  最大区域等级: 100,
  每点幸运值增加掉落率百分比: 1,
  最高专精等级百分比经验加成: 5,
  最高专精等级倍率经验加成: 1.01,
  伤害分布总伤害加成: 0.1, // 伤害分布总体超出100%的部分，每1%加成x%总伤害，均摊到所有类型伤害。
  伤害分布单体伤害加成: 0.1, // 伤害分布单体超出100%的部分，每1%加成x%总伤害，但为该类型伤害。因此，单一伤害类型的职业前期伤害较高（1级就满足单项100%）。
  防御值最多减少伤害百分比: 80,
  合成等级软上限: 100,
  合成等级加成: 0.01,
  /**
   * 装备合成以及区域难度会影响的实体属性。
   */
  可增益属性: [
    '最大生命值',
    '最大魔法值',
    '生命回复',
    '魔法回复',
    '攻击力',
    '防御力',
    '伤害分布',
    '伤害抗性',
  ],
  /**
   * 装备合成、品阶（来源于区域难度）以及区域难度不会影响的实体属性。
   * * 装备品质/稀有度会影响所有属性。
   * 这样设计是因为，如果全部属性都倍增，装备/实体的实际强度会指数级地增加。
   */
  无增益属性: [
    '生命回复效率',
    '魔法回复效率',
    '攻击间隔',
    '攻击速度',
    '暴击率',
    '暴击伤害',
    '闪避率',
    '格挡率',
    '格挡伤害',
    '抗性穿透',
    '生命偷取',
    '技能急速',
    '幸运值',
    '最大魔典数',
  ],
};

// 游戏设置，有些影响游戏性，有些影响用户体验。
const settings = {
  HTML更新间隔: 50, // ms
  游戏倍速: 1,
  背包物品每页数量: 36,
  背包页面最大数量: 10,
  战斗面板外战斗信息: false,
  技能栏每行技能数量: 5,
};

const getRequiredExp = (level) => {
  const base = '200 * level + 1.012^(level-1) * 5000 - 5000';
  const per5 = '2000 * floor(level / 5)^2';
  const per10 = '10000 * floor(level / 10)^2';
  const per20 = '50000 * floor(level / 20)^2';
  const per50 = '400000 * floor(level / 50)^2';
  const per100 = '2500000 * floor(level / 100)^2';
  const total = math.evaluate(`${base} + ${per5} + ${per10} + ${per20} + ${per50} + ${per100}`, {
    level,
  });
  return total;
};

const 计算合成等级 = (合成次数) => {
  if (合成次数 <= config.合成等级软上限) {
    return 合成次数;
  }
  const 超出等级 = 合成次数 - config.合成等级软上限;
  const formula = 'level^0.5';
  return config.合成等级软上限 + math.evaluate(formula, { level: 超出等级 });
};

const get最高专精等级经验倍率 = (最高专精等级) => {
  const mult =
    (1 + (最高专精等级 * config.最高专精等级百分比经验加成) / 100) *
    config.最高专精等级倍率经验加成 ** 最高专精等级;
  return mult;
};

const setGameSpeed = (speed) => {
  if (isProduction() && (speed < 0 || speed > 10)) {
    console.error('游戏倍速必须在0到10之间');
    settings.游戏倍速 = _.clamp(speed, 0, 10);
  } else {
    settings.游戏倍速 = speed;
  }
};

addToWindow('setGameSpeed', setGameSpeed);

export {
  默认优先级,
  getRequiredExp,
  计算合成等级,
  config,
  config as gameConfig,
  get最高专精等级经验倍率,
  settings,
  setGameSpeed,
};
