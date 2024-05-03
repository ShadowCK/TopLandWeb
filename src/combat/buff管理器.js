import _ from 'lodash';
import { Buff } from './Buff.js';
import { 默认优先级 } from '../settings.js';
import { BuffType } from '../enums.js';

/**
 * @param {import('./实体.js').default} parent
 * @param {{type, value}} statObj
 * @returns
 */
const getBuffedStat = (parent, statObj) => {
  if (!parent.buffs) {
    return statObj.value;
  }

  const typeBuffs = parent.buffs[statObj.type];
  if (!typeBuffs) {
    return statObj.value;
  }

  const [弱乘算buff, 其他buff] = _.partition(typeBuffs, (buff) => buff.type === BuffType.弱乘算);
  const newBuffs = [...其他buff];
  if (弱乘算buff.length > 0) {
    const 弱乘算总和 = 弱乘算buff.reduce((acc, buff) => acc + buff.value, 1);
    newBuffs.push(
      new Buff({
        key: '弱乘算总和',
        statType: statObj.type,
        value: 弱乘算总和,
        type: BuffType.弱乘算,
        priority: 默认优先级.弱乘算,
      }),
    );
  }
  // 基础值作为buff计算（不是真的buff!)
  newBuffs.push(
    new Buff({
      key: '基础值',
      statType: statObj.type,
      value: statObj.value,
      type: BuffType.固定数值,
      priority: 默认优先级.基础值,
    }),
  );
  // 按优先级从高到低（数值从低到高）排序
  newBuffs.sort((a, b) => a.priority - b.priority);
  return newBuffs.reduce((acc, buff) => buff.apply(acc), 0);
};

export { getBuffedStat };
