import { 默认优先级 } from '../settings.js';
import buffTypes from './buffTypes.js';
import { statTypes } from './战斗属性.js';

class Buff {
  // Buff的名字/ID
  key = '';

  // Buff影响的数值
  statType = statTypes.攻击力;

  // Buff的数值
  value = 1;

  // Buff的类型
  type = buffTypes.固定数值;

  // Buff的优先级，数值越低，优先级越高
  priority = 默认优先级.固定数值;

  // 是否可以叠加，如果无法叠加会覆盖之前的Buff
  canStack = true;

  // 是否是正面Buff。有些技能净化正面Buff，有些技能净化负面Buff。
  // 不取决于实际效果，即使是增加攻击力的Buff，也可能是负面Buff。
  isPositive = true;

  // 是否可以被清除
  canCleanse = false;

  // Buff的持续时间
  duration = -1;

  // Buff的持续时间计时器
  timer = 0;

  // TODO
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
    return this.type === buffTypes.强乘算 || this.type === buffTypes.弱乘算;
  }

  apply(value) {
    return this.isMultiplier() ? value * this.value : value + this.value;
  }

  isExpired() {
    return this.isFinite() && this.timer >= this.duration;
  }
}

export default Buff;
