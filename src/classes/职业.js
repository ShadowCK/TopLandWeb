import _ from 'lodash';
import { defaultStats } from '../combat/战斗属性.js';
import { getRequiredExp } from '../settings.js';
import { getMaxLevel } from '../utils.js';
import { EquipType } from '../items/装备信息.js';

class 职业 {
  requirements = {};

  /** @type {import('../combat/实体.js').default} */
  parent = null;

  name = '无名氏';

  description = '一个无名氏。';

  exp = 0;

  level = 1;

  maxLevel = 1;

  expertiseLevel = 0;

  statGrowth = JSON.parse(JSON.stringify(defaultStats));

  装备槽 = {
    [EquipType.武器]: 1,
    [EquipType.副手]: 1,
    [EquipType.头盔]: 1,
    [EquipType.胸甲]: 1,
    [EquipType.护腿]: 1,
    [EquipType.鞋子]: 1,
    [EquipType.项链]: 1,
    [EquipType.戒指]: 1,
    [EquipType.饰品]: 1,
  };

  // 必杀技/大招
  ultimate = null;

  constructor(classConfig) {
    // 使用deep copy防止class config被修改
    const copy = JSON.parse(JSON.stringify(classConfig));
    Object.assign(this, copy);
  }

  getMaxLevel = () => getMaxLevel(this.maxLevel, this.expertiseLevel);

  getExpToNextLevel = () => getRequiredExp(this.level);

  addExp(exp, mult = 1) {
    this.exp += exp * mult;
    let requiredExp = this.getExpToNextLevel();
    while (this.exp >= requiredExp) {
      if (this.level === this.getMaxLevel()) {
        this.exp = requiredExp;
        break;
      }
      this.exp -= requiredExp;
      this.addLevel(1);
      requiredExp = this.getExpToNextLevel();
    }
  }

  addLevel(value) {
    const levels = Math.floor(value);
    const newLevel = Math.min(this.level + levels, this.getMaxLevel());
    // 已经是最大等级，不用更新
    if (newLevel === this.level) {
      return;
    }
    this.level = newLevel;
    this.parent.updateStats();
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
