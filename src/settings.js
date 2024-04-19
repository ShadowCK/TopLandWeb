import * as math from 'mathjs';

// 计算实际属性时，基础值、Buff等加成的应用顺序
const 默认优先级 = {
  基础值: 100,
  强乘算: 200,
  弱乘算: 300,
  固定数值: 400,
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
  刷怪间隔: 5,
  无敌人刷怪倍速: 10,
  必定刷新BOSS刷怪数量: 20,
  最大区域等级: 100,
  每点幸运值增加掉落率百分比: 1,
  最高专精等级百分比经验加成: 5,
  最高专精等级倍率经验加成: 1.01,
};

const get最高专精等级经验倍率 = (expertiseLevel) => {
  const mult =
    (1 + (expertiseLevel * config.最高专精等级百分比经验加成) / 100) *
    config.最高专精等级倍率经验加成 ** expertiseLevel;
  return mult;
};

export { 默认优先级, getRequiredExp, config, get最高专精等级经验倍率 };
