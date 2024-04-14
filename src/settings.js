import * as math from 'mathjs';

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

export { 默认优先级, getRequiredExp };
