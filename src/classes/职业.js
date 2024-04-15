import _ from 'lodash';
import { defaultStats } from '../combat/战斗属性.js';
import { getRequiredExp, config } from '../settings.js';

class 职业 {
  /** @type {import('../combat/实体.js').default} */
  requirements = {};

  parent = null;

  name = '无名氏';

  description = '一个无名氏。';

  exp = 0;

  level = 1;

  maxLevel = 1;

  expertiseLevel = 1;

  statGrowth = JSON.parse(JSON.stringify(defaultStats));

  // 必杀技/大招
  ultimate = null;

  constructor(classConfig) {
    const copy = JSON.parse(JSON.stringify(classConfig));
    Object.assign(this, copy);
  }

  getMaxLevel = () => this.maxLevel + this.expertiseLevel * config.extraLevelsPerExpertiseLevel;

  getExpToNextLevel = () => getRequiredExp(this.level);

  addExp(exp) {
    this.exp += exp;
    while (this.exp >= this.getExpToNextLevel()) {
      this.addLevel(1);
    }
  }

  addLevel(value) {
    const newLevel = Math.min(this.level + value, this.getMaxLevel());
    if (newLevel === this.level) {
      return;
    }
    this.parent.updateStats(this.statGrowth);
  }

  setLevel(level, ignoreMaxLevel = false) {
    const maxLevel = this.getMaxLevel();
    if (level > maxLevel && !ignoreMaxLevel) {
      console.error('等级不能超过最大等级');
      this.level = maxLevel;
    } else if (level < 1) {
      console.error('等级不能小于1');
      this.level = 1;
    } else {
      this.level = level;
    }
    if (this.parent) {
      this.parent.updateStats();
    }
  }
}

export default 职业;
