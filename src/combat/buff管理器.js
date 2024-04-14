import _ from 'lodash';
import buffTypes from './buffTypes.js';
import Buff from './Buff.js';

// TODO

const getBuffedStat = (parent, statObj) => {
  if (!parent.buffs) {
    return statObj.value;
  }

  const typeBuffs = parent.buffs[statObj.type];
  if (!typeBuffs) {
    return statObj.value;
  }

  const [弱乘算buff, 其他buff] = _.partition(typeBuffs, (buff) => buff.type === buffTypes.弱乘算);
  const 弱乘算总和 = 弱乘算buff.reduce((acc, buff) => acc + buff.value, 1);
  const newBuffs = [...其他buff, 弱乘算总和];
  // 基础值
  newBuffs.push(
    new Buff({
      statType: statObj.type,
      value: statObj.value,
      type: buffTypes.固定数值,
      priority: 100,
    }),
  );
  // 按优先级从高到低（数值从低到高）排序
  newBuffs.sort((a, b) => a.priority - b.priority);
  return newBuffs.reduce((acc, buff) => buff.apply(acc), 0);
};

export { getBuffedStat };
