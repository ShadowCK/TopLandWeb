import _ from 'lodash';
import { getBuffedStat } from './buff管理器.js';

class 实体 {
  stats = {};

  buffs = {};

  生命值 = 100;

  魔法值 = 100;

  isDead = false;

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

  updateStats() {
    throw new Error('Method "updateStats()" must be implemented by subclass');
  }

  /**
   * 获取属性的数值，支持多级属性，如"抗性穿透.物理"
   * @param {string} statType
   */
  getStat(statType, calcBuffs = true) {
    const nodes = statType.split('.');
    let base = this.stats;
    for (let i = 0; i < nodes.length - 1; i++) {
      const prop = nodes[i];
      if (base[prop] == null) {
        console.error(`Stat "${statType}" not found`);
        return 0;
      }
      base = base[nodes[i]];
    }
    base = Number(base);
    if (Number.isNaN(base)) {
      console.error(`Stat "${statType}" is not a number`);
      return 0;
    }
    return calcBuffs ? getBuffedStat(this, { value: base, type: statType }) : base;
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
    // Lodash的forEach方法可以遍历对象
    _.forEach(this.buffs, (typeBuffs) => {
      _.forEach(typeBuffs, (buff) => {
        buff.update(dt);
        if (buff.isExpired()) {
          this.removeBuff(buff);
        }
      });
    });
  }
}

export default 实体;
