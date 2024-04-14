import _ from 'lodash';
import { getBuffedStat } from './buff管理器.js';

class 实体 {
  stats = {};

  buffs = {};

  constructor() {
    if (new.target === 实体) {
      throw new Error('实体 cannot be instantiated directly.');
    }
  }

  updateStats() {
    throw new Error('Method "updateStats()" must be implemented by subclass');
  }

  getStat(statType, calcBuffs = true) {
    const base = this.stats[statType];
    return calcBuffs ? this.getBuffedStat(statType, base) : base;
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
      console.warn('statType and key are required to remove a buff');
      return;
    }
    if (!this.buffs[statType]) {
      return;
    }
    _.remove(this.buffs[statType], (other) => other.key === key);
  }

  update(dt) {
    // Lodash的forEach方法可以遍历对象
    _.forEach(this.buffs, (buffs) => {
      _.forEach(buffs, (buff) => {
        buff.update(dt);
        if (buff.isExpired()) {
          this.removeBuff(buff);
        }
      });
    });
  }
}

export default 实体;
