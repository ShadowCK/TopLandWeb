import _ from 'lodash';
import { Buff } from '../combat/Buff.js';
import { getPlayer } from '../player/玩家管理器.js';
import { 计算抽奖奖励, 计算抽奖花费, 默认优先级 } from '../settings.js';
import { BuffType, StackType } from '../enums.js';
import { addToWindow, checkNotNull } from '../debug.js';

const 固定数值奖品信息 = {
  最大生命值: 50,
  最大魔法值: 50,
  生命回复: 5,
  魔法回复: 5,
  生命回复效率: 0.02,
  魔法回复效率: 0.02,
  攻击力: 5,
  防御力: 5,
  攻击间隔: -0.01,
  攻击速度: 0.04,
  暴击率: 1,
  暴击伤害: 2,
  闪避率: 1,
  格挡率: 1.5,
  格挡伤害: 2,
  生命偷取: 0.5,
  技能急速: 2,
  幸运值: 1,
};

const 百分比奖品信息 = {
  最大生命值: 1,
  最大魔法值: 1,
  生命回复: 1,
  魔法回复: 1,
  攻击力: 1,
  防御力: 1,
};

/**
 * @param {boolean} useExpertise 使用专精还是金钱抽奖
 * @param {number} isFlatBuff 抽取的buff是固定数值还是百分比
 * @returns {抽奖信息}
 */
const 获取抽奖信息 = (useExpertise, isFlatBuff) => {
  checkNotNull({ useExpertise, isFlatBuff });
  const player = getPlayer();
  const times = useExpertise ? player.专精抽奖次数 : player.金钱抽奖次数;
  const resource = useExpertise ? player.抽奖用专精等级 : player.金钱;
  const cost = 计算抽奖花费(times, useExpertise);
  return {
    success: resource >= cost,
    useExpertise,
    isFlatBuff,
    player,
    times,
    resource,
    cost,
  };
};

/**
 * 无视抽奖条件，获取指定数量的buff
 * @param {number} count 抽取的buff数量
 * @param {抽奖信息} 抽奖信息
 * @returns {抽奖奖励[]}
 */
const 试抽Buff = (count, 抽奖信息) => {
  checkNotNull({ count, 抽奖信息 });
  const { isFlatBuff, times } = 抽奖信息;
  const rewards = [];
  const 奖品信息 = Object.entries(isFlatBuff ? 固定数值奖品信息 : 百分比奖品信息);
  if (奖品信息.length < count) {
    throw new Error('奖品信息不足');
  }
  for (let i = 0; i < count; i++) {
    const rewardMult = 计算抽奖奖励(times, isFlatBuff);
    const reward = _.sample(奖品信息);
    _.pull(奖品信息, reward);
    rewards.push({
      statType: reward[0],
      value: reward[1] * rewardMult.base * rewardMult.quality,
      base: reward[1],
      baseMult: rewardMult.base,
      qualityMult: rewardMult.quality,
      type: isFlatBuff ? BuffType.固定数值 : BuffType.弱乘算,
      priority: isFlatBuff ? 默认优先级.固定数值 : 默认优先级.弱乘算,
    });
  }
  return rewards;
};

/**
 * @param {抽奖信息} 抽奖信息
 */
const 扣除抽奖花费 = (抽奖信息) => {
  checkNotNull({ 抽奖信息 });
  const { useExpertise, player, cost } = 抽奖信息;
  // 扣除抽奖消耗，增加抽奖次数
  if (useExpertise) {
    player.抽奖用专精等级 -= cost;
    player.专精抽奖次数 += 1;
  } else {
    player.金钱 -= cost;
    player.金钱抽奖次数 += 1;
  }
};

/**
 * @param {抽奖信息} 抽奖信息
 * @param {抽奖奖励} 抽奖奖励
 */
const 施加Buff = (抽奖信息, 抽奖奖励) => {
  checkNotNull({ 抽奖信息, 抽奖奖励 });
  const { isFlatBuff, player } = 抽奖信息;
  const { statType, value, type, priority } = 抽奖奖励;
  player.addBuff(
    new Buff({
      key: `抽奖奖励-${isFlatBuff ? '固定数值' : '百分比'}`,
      statType,
      value: isFlatBuff ? value : value / 100, // 将百分比转换为倍率
      type,
      priority,
      // 默认为叠加堆叠，正面Buff，不可净化，永久持续
      stackType: StackType.叠加堆叠,
      isPositive: true,
      canCleanse: false,
      duration: -1,
    }),
  );
};

export { 获取抽奖信息, 试抽Buff, 扣除抽奖花费, 施加Buff };
