import defaultStats from '../combat/战斗属性.js';
import { getRequiredExp } from '../settings.js';

class 职业 {
  /** @type {import('../combat/实体.js').default} */
  parent = null;

  name = '无名氏';

  description = '一个无名氏。';

  exp = 0;

  level = 1;

  maxLevel = 1;

  skills = [];

  statGrowth = JSON.parse(JSON.stringify(defaultStats));

  最大魔典数 = 1;

  已装备魔典 = [];

  constructor(classData) {
    // TODO with classData
    this.parent.updateStats();
  }

  addExp(exp) {
    this.exp += exp;
    while (this.exp >= getRequiredExp(this.level)) {
      this.addLevel(1);
    }
  }

  addLevel(levels) {
    const newLevel = Math.min(this.level + levels, this.maxLevel);
    // 玩家已经达到最大等级
    if (newLevel === this.level) {
      return;
    }
    this.parent.updateStats(this.statGrowth);
  }
}
