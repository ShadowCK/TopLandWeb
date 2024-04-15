import _ from 'lodash';
import { getBuffedStat } from './buff管理器.js';
import * as 战斗管理器 from './战斗管理器.js';
import { statTypes } from './战斗属性.js';

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

  updateStats() {
    throw new Error('Method "updateStats()" must be implemented by subclass');
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

  /**
   * 获取属性的数值，支持多级属性，如"抗性穿透.物理"
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
    const updateCombat = () => {
      if (!战斗管理器.isInCombat(this)) {
        return;
      }
      const target = 战斗管理器.getTarget(this);
      if (!target) {
        return;
      }
      const 攻击速度 = Math.max(0, this.getStat(statTypes.攻击速度) / 100);
      this.攻击计时器 += dt * 攻击速度;
      if (this.攻击计时器 >= this.getStat(statTypes.攻击间隔, true)) {
        this.攻击计时器 = 0;
        战斗管理器.basicAttack({
          damager: this,
          damaged: target,
          damageType: '物理', // TODO: 以后会给实体加入伤害类型（伤害分布）
        });
      }

      // TODO: 如果自动施法打开，并且有技能可用，自动使用技能
    };

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

    // 如果在战斗中，造成伤害，自动使用主动技能
    updateCombat();

    // 填充攻击计时器

    // TODO: 更新技能CD
  }

  /**
   * @param {import('../classes/职业.js').default} 职业
   * @param {Number} level
   */
  设置职业(职业) {
    职业.parent = this;
    this.职业 = 职业;
    职业.setLevel(职业.level); // Stats will be updated here
    this.生命值 = this.getStat(statTypes.最大生命值, false);
    this.魔法值 = this.getStat(statTypes.最大魔法值, false);
  }
}

export default 实体;
