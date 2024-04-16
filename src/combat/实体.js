import _ from 'lodash';
import { getBuffedStat } from './buff管理器.js';
import { statTypes } from './战斗属性.js';
import * as settings from '../settings.js';
import { updateCombat } from './战斗管理器.js';

class 实体 {
  stats = {};

  buffs = {};

  skills = [];

  /** @type {import('../classes/职业.js').default} */
  职业 = null;

  魔典 = [];

  装备 = [];

  生命值 = 100;

  魔法值 = 100;

  isDead = false;

  回复计时器 = 0;

  攻击计时器 = 0;

  takeDamage(value) {
    if (value <= 0) {
      return;
    }
    this.生命值 -= value;
    if (this.生命值 < 0) {
      this.生命值 = 0;
    }
    if (this.生命值 === 0 && !this.isDead) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
  }

  constructor() {
    if (new.target === 实体) {
      throw new Error('实体 cannot be instantiated directly.');
    }
  }

  /**
   * 获取职业的属性成长配置中给定属性的数值
   * @param {string | string[]} path 属性的路径，如"最大生命值"，"抗性穿透.物理
   * @returns
   */
  getStatGrowth(path) {
    return _.get(this.职业.statGrowth, path) || [0, 0];
  }

  updateStats() {
    const { statGrowth, level } = this.职业;
    // 递归函数来处理stats
    const processStats = (stats, path = []) => {
      _.forEach(stats, (value, key) => {
        const currentPath = path.concat(key);
        if (Array.isArray(value)) {
          // 如果是数组（statGrowth），计算值并设置。
          const [base, scale] = value;
          _.set(this.stats, currentPath, base + scale * (level - 1));
        } else if (_.isObject(value)) {
          // 如果是对象，递归处理
          processStats(value, currentPath);
        }
      });
    };
    // 调用递归函数处理所有stats
    processStats(statGrowth);
  }

  heal(value) {
    const 最大生命值 = this.getStat(statTypes.最大生命值);
    const 生命回复效率 = this.getStat(statTypes.生命回复效率);
    this.生命值 = Math.min(最大生命值, this.生命值 + value * 生命回复效率);
  }

  restoreMana(value) {
    const 最大魔法值 = this.getStat(statTypes.最大魔法值);
    const 魔法回复效率 = this.getStat(statTypes.魔法回复效率);
    this.魔法值 = Math.min(最大魔法值, this.魔法值 + value * 魔法回复效率);
  }

  getStat2(statType, calcBuffs = true) {
    const range = settings.config.statLimits[statType];
    return this.getStat(statType, calcBuffs, range);
  }

  /**
   * 获取属性的数值，支持多级属性，如"抗性穿透.物理"
   * @note 通常情况下，请用getStat2来应用属性的默认上下限。
   * @note 自定义range是用于技能效果的。比如某技能受暴击率加成，但有效的暴击率范围是0~20%。
   * @param {string} statType can be a path
   */
  getStat(statType, calcBuffs = true, range = { min: -Infinity, max: Infinity }) {
    const base = _.get(this.stats, statType);
    if (base == null) {
      console.error(`Stat "${statType}" not found`);
      return 0;
    }
    const result = calcBuffs ? getBuffedStat(this, { value: base, type: statType }) : base;
    return _.clamp(result, range.min, range.max);
  }

  get最大魔典数() {
    return Math.max(1, Math.floor(this.getStat(statTypes.最大魔典数)));
  }

  calcStat(value, statType) {
    const base = value;
    return getBuffedStat(this, { value: base, type: statType });
  }

  /**
   * @param {import('./Buff.js').default} buff
   */
  addBuff(buff) {
    if (!this.buffs[buff.statType]) {
      this.buffs[buff.statType] = [];
    }
    // 如果Buff不可叠加，先清除之前的Buff
    if (!buff.canStack) {
      this.removeBuff(buff);
    }
    this.buffs[buff.statType].push(buff);
  }

  /**
   * @param {import('./Buff.js').default} buff
   */
  removeBuff(buff) {
    this.removeBuffByKey(buff.statType, buff.key);
  }

  removeBuffByKey(statType, key) {
    if (!statType || !key) {
      console.error('statType and key are required to remove a buff');
      return;
    }
    if (!this.buffs[statType]) {
      return;
    }
    _.remove(this.buffs[statType], (other) => other.key === key);
  }

  update(dt) {
    // 更新Buff
    // Lodash的forEach方法可以遍历对象
    _.forEach(this.buffs, (typeBuffs, _statType) => {
      typeBuffs.forEach((buff) => {
        buff.update(dt);
        if (buff.isExpired()) {
          this.removeBuff(buff);
        }
      });
    });

    // 回复生命值和魔法值
    this.回复计时器 += dt;
    if (this.回复计时器 >= 1) {
      this.回复计时器 = 0;
      this.heal(this.getStat(statTypes.生命回复, true));
      this.restoreMana(this.getStat(statTypes.魔法回复, true));
    }

    updateCombat(this, dt);
  }

  /**
   * @param {import('../classes/职业.js').default} 职业
   * @param {Number} level
   */
  设置职业(职业) {
    职业.parent = this;
    this.职业 = 职业;
    // 属性在setLevel中被更新
    // 使用setLevel是为了保证职业的等级在有效范围内
    职业.setLevel(职业.level);
    this.生命值 = this.getStat(statTypes.最大生命值, false);
    this.魔法值 = this.getStat(statTypes.最大魔法值, false);
  }
}

export default 实体;
