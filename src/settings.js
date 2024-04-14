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
    闪避率: { min: 0, max: 80 },
    格挡率: { min: 0, max: 100 },
    格挡伤害: { min: 0, max: 95 },
    生命偷取: { min: 0, max: Infinity },
  },
};

export { 默认优先级, getRequiredExp, config };
