import { 默认优先级 } from '../settings.js';
import { StatType } from './战斗属性.js';
import { BuffType, StackType } from '../enums.js';

class Buff {
  // Buff的名字/ID
  key = '';

  /**
   * Buff影响的属性，可以是个路径，如'伤害抗性.物理'。
   * 不会像getStat和updateStats那样自动解析路径，而是直接使用路径作为key。
   */
  statType = StatType.攻击力;

  // Buff的数值
  value = 1;

  // Buff的类型
  type = BuffType.固定数值;

  // Buff的优先级，数值越低，优先级越高
  priority = 默认优先级.固定数值;

  stackType = StackType.无法叠加;

  // 是否是正面Buff。有些技能净化正面Buff，有些技能净化负面Buff。
  // 不取决于实际效果，即使是增加攻击力的Buff，也可能是负面Buff。
  isPositive = true;

  // 是否可以被清除
  canCleanse = false;

  // Buff的持续时间
  duration = -1;

  // Buff的持续时间计时器
  timer = 0;

  constructor(options) {
    Object.assign(this, options);
  }

  update(dt) {
    this.timer += dt;
  }

  isFinite() {
    return this.duration !== Infinity && this.duration > 0;
  }

  isMultiplier() {
    return this.type === BuffType.强乘算 || this.type === BuffType.弱乘算;
  }

  apply(value) {
    return this.isMultiplier() ? value * this.value : value + this.value;
  }

  isExpired() {
    return this.isFinite() && this.timer >= this.duration;
  }
}

export { StackType, Buff };
