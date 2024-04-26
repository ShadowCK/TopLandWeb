import _ from 'lodash';
import { defaultStats } from '../combat/战斗属性.js';
import { getRequiredExp } from '../settings.js';
import { getMaxLevel } from '../utils.js';
import { EquipSlot } from '../enums.js';

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
    [EquipSlot.武器]: 1,
    [EquipSlot.副手]: 1,
    [EquipSlot.头盔]: 1,
    [EquipSlot.胸甲]: 1,
    [EquipSlot.护腿]: 1,
    [EquipSlot.鞋子]: 1,
    [EquipSlot.项链]: 1,
    [EquipSlot.戒指]: 1,
    [EquipSlot.饰品]: 1,
  };

  // 必杀技/大招
  ultimate = null;

  constructor(classConfig) {
    // 使用deep copy防止class config被修改
    const clone = _.cloneDeep(classConfig);
    Object.assign(this, _.omit(clone, '装备槽'));
    // 如果职业的装备槽配置是 {武器:2}, 那么merge后装备槽会变成 {..., 武器:2}，而不是像object.assign那样直接替换
    _.merge(this.装备槽, clone.装备槽);
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

  toSaveData() {
    return _.omit(this, 'parent');
  }
}

export default 职业;
