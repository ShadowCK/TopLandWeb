import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { getBuffedStat } from './buff管理器.js';
import { StatType } from './战斗属性.js';
import * as settings from '../settings.js';
import { EventType, combatEvents } from '../events/事件管理器.js';

class 实体 {
  uuid = uuidv4();

  stats = {};

  buffs = {};

  skills = [];

  /** @type {import('../classes/职业.js').default} */
  职业 = null;

  魔典 = [];

  /** @type {Object<string, import('../items/装备.js').default[]>} */
  装备 = {};

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
    combatEvents.emit(EventType.实体死亡, { entity: this });
  }

  复活(生命值百分比 = 0.00001) {
    this.isDead = false;
    this.生命值 = this.getStat2(StatType.最大生命值) * 生命值百分比;
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

  updateStats(multiplier = 1) {
    const 原始最大生命值 = this.stats[StatType.最大生命值];
    const 原始最大魔法值 = this.stats[StatType.最大生命值];

    const { statGrowth, level } = this.职业;
    // 递归函数来处理statGrowth
    const applyStatGrowth = (stats, path = []) => {
      _.forEach(stats, (value, key) => {
        const currentPath = path.concat(key);
        if (Array.isArray(value)) {
          // 如果是数组（statGrowth），计算值并设置。
          const [base, scale] = value;
          _.set(this.stats, currentPath, base + scale * (level - 1) * multiplier);
        } else if (_.isObject(value)) {
          // 如果是对象，递归处理
          applyStatGrowth(value, currentPath);
        }
      });
    };
    // 调用递归函数处理所有stats
    applyStatGrowth(statGrowth);

    const applyEquipmentBonus = (stats, path = []) => {
      _.forEach(stats, (value, key) => {
        const currentPath = path.concat(key);
        if (_.isObject(value)) {
          // 如果是对象，递归处理
          applyEquipmentBonus(value, currentPath);
        } else {
          _.set(this.stats, currentPath, this.getStat2(currentPath, false) + value);
        }
      });
    };

    // 添加装备的属性
    _.forEach(this.装备, (typeEquipments) => {
      typeEquipments.forEach((item) => {
        applyEquipmentBonus(item.stats);
      });
    });

    // 根据新的属性计算新的生命值和魔法值
    const 最大生命值 = this.getStat2(StatType.最大生命值);
    const 最大魔法值 = this.getStat2(StatType.最大魔法值);
    this.生命值 = (this.生命值 / 原始最大生命值) * 最大生命值;
    this.魔法值 = (this.魔法值 / 原始最大魔法值) * 最大魔法值;
  }

  heal(value) {
    const 最大生命值 = this.getStat2(StatType.最大生命值);
    const 生命回复效率 = this.getStat2(StatType.生命回复效率);
    this.生命值 = Math.min(最大生命值, this.生命值 + value * 生命回复效率);
  }

  restoreMana(value) {
    const 最大魔法值 = this.getStat2(StatType.最大魔法值);
    const 魔法回复效率 = this.getStat2(StatType.魔法回复效率);
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
    // 有可能是属性名写错了，也有可能是没有配置该属性（比如实体没有抗性穿透.物理）
    // TODO: 可以细分该情况，通过比对一个默认的属性配置表（默认属性值，来判断是写错了还是略过配置
    // 已经有defaultStats可以利用了，但是defaultStats不全。而且Object.assign给statGrowth不是递归赋值，只是简单地覆盖
    // 也就是说，抗性穿透这种是一个object的属性，即使默认配置是全的，也会被职业配置里内容更少的完全覆盖，导致抗性穿透.XX还是空的。
    // 所以，要么补全defaultStats并在这里检测defaultStats里是否有该属性（也就是不用考虑被更少的覆盖，反正defaultStats里有）；
    // 要么让defaultStats给statGrowth时是递归赋值，保证配置不写全的情况下，所有属性也都有默认值（那样就不用检测defaultStats里是否有该属性了，
    // this.stats/statGrowth没有就是肯定没有）。递归赋值可以参考updateStats里的processStats的结构。
    if (base == null) {
      return 0;
    }
    const result = calcBuffs ? getBuffedStat(this, { value: base, type: statType }) : base;
    return _.clamp(result, range.min, range.max);
  }

  get最大魔典数() {
    return Math.max(1, Math.floor(this.getStat2(StatType.最大魔典数)));
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
    if (this.isDead) {
      return;
    }
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
      this.heal(this.getStat2(StatType.生命回复, true));
      this.restoreMana(this.getStat2(StatType.魔法回复, true));
    }
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
    this.生命值 = this.getStat2(StatType.最大生命值, true);
    this.魔法值 = this.getStat2(StatType.最大魔法值, true);
  }

  // * 只是为了进度条显示，跟实际攻击间隔同比例增长。数值上没有实际意义
  // （因为攻速可以发生变化，所以不能代表实际消逝的时间，是*基于当前攻速*的实际时间流逝）
  攻击计时器去掉攻速() {
    const 攻击速度 = this.getStat2(StatType.攻击速度);
    // 防止Not a number
    return 攻击速度 === 0 ? 0 : this.攻击计时器 / this.getStat2(StatType.攻击速度);
  }

  // 这个数值上是有意义的
  实际攻击间隔() {
    return this.getStat2(StatType.攻击间隔) / this.getStat2(StatType.攻击速度);
  }
}

export default 实体;
