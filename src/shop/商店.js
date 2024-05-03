import _ from 'lodash';
import { Buff } from '../combat/Buff.js';
import { getPlayer } from '../player/玩家管理器.js';
import { 计算抽奖奖励, 计算抽奖花费, 默认优先级 } from '../settings.js';
import { BuffType, StackType } from '../enums.js';
import { addToWindow } from '../debug.js';

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

const 抽取Buff = (useExpertise = false, 固定数值buff = true) => {
  const player = getPlayer();
  const times = useExpertise ? player.专精抽奖次数 : player.金钱抽奖次数;
  const resource = useExpertise ? player.抽奖用专精等级 : player.金钱;
  const cost = 计算抽奖花费(times, useExpertise);
  if (resource < cost) {
    return false;
  }
  if (useExpertise) {
    player.抽奖用专精等级 -= cost;
  } else {
    player.金钱 -= cost;
  }
  const rewardMult = 计算抽奖奖励(times, 固定数值buff);
  const reward = _.sample(Object.entries(固定数值buff ? 固定数值奖品信息 : 百分比奖品信息));
  player.addBuff(
    new Buff({
      key: `抽奖奖励-${固定数值buff ? '固定数值' : '百分比'}`,
      statType: reward[0],
      value: (固定数值buff ? reward[1] : reward[1] / 100) * rewardMult, // 将百分比转换为倍率
      type: 固定数值buff ? BuffType.固定数值 : BuffType.弱乘算,
      priority: 固定数值buff ? 默认优先级.固定数值 : 默认优先级.弱乘算,
      stackType: StackType.叠加堆叠,
      isPositive: true,
      canCleanse: false,
      duration: -1,
    }),
  );
  if (useExpertise) {
    player.专精抽奖次数 += 1;
  } else {
    player.金钱抽奖次数 += 1;
  }
  return {
    statType: reward[0],
    value: reward[1] * rewardMult, // 显示的仍然是百分比而不是倍率
  };
};

addToWindow('抽取Buff', 抽取Buff);

export { 抽取Buff };
